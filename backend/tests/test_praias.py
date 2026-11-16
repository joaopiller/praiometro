import json
from datetime import UTC, datetime

import mongomock
from fastapi.testclient import TestClient

from praiometro.api.app import create_app
from praiometro.avaliacoes import RepositorioVotos
from praiometro.praias import agrupar, situacao
from praiometro.relatos import RepositorioRelatos

from .conftest import verificador_falso

VOTOS = dict.fromkeys(("limpeza", "acessibilidade", "infraestrutura", "seguranca", "tranquilidade"), 4.0)
AUTH = {"Authorization": "Bearer valido-u1"}


def test_situacao_da_praia():
    assert situacao([True, True]) == "propria"
    assert situacao([False, None]) == "impropria"
    assert situacao([True, False, None]) == "parcial"
    assert situacao([None]) == "sem_dados"


def test_pontos_agrupados_por_praia(estado):
    praias = agrupar(estado)
    assert len(praias) == 14
    assert list(praias)[:3] == ["GR", "BV", "FC"]
    icarai = praias["IC"]
    assert icarai["nome"] == "Praia de Icaraí"
    assert len(icarai["pontos"]) == 4
    # sem ponto "principal" no boletim, fica o do meio da praia
    assert icarai["principal"] == "IC002"
    # em Camboinhas, o ponto sem referência específica
    assert praias["CM"]["principal"] == "CM000"


def test_lista_de_praias_mostra_praia_parcial(settings, estado, repo):
    estado["IC002"]["leitura_atual"]["balneabilidade"] = False
    settings.estado_file.write_text(json.dumps(estado), encoding="utf-8")
    with TestClient(create_app(settings, repo=repo, verificador=verificador_falso)) as client:
        praias = {p["id"]: p for p in client.get("/praias").json()["praias"]}
    assert len(praias) == 14
    assert praias["IC"]["situacao"] == "parcial"
    assert (praias["IC"]["pontos_proprios"], praias["IC"]["pontos_com_dados"]) == (3, 4)
    assert praias["GR"]["situacao"] == "propria"
    assert all(len(p["centro"]) == 2 for p in praias.values())
    assert {p["codigo"] for p in praias["IC"]["pontos"]} == {"IC003", "IC00", "IC002", "IC001"}


def test_detalhe_da_praia_traz_leitura_do_ponto_principal(client):
    r = client.get("/praias/IC")
    assert r.status_code == 200
    dados = r.json()
    assert dados["nome"] == "Praia de Icaraí"
    assert dados["leitura_atual"]["temperature_2m"] == 29.1
    assert client.get("/praias/ic").status_code == 200
    assert client.get("/praias/XX").status_code == 404


def test_votos_de_pontos_diferentes_contam_para_a_mesma_praia(client):
    client.post("/votar", params={"praia_id": "IC003"}, json=VOTOS, headers=AUTH)
    client.post(
        "/votar", params={"praia_id": "IC"}, json=VOTOS, headers={"Authorization": "Bearer valido-u2"}
    )
    resumo = client.get("/praias/IC/avaliacao").json()
    assert resumo["praia_id"] == "IC"
    assert resumo["total_avaliacoes"] == 2
    # rota antiga, por ponto, devolve a mesma avaliação
    assert client.get("/pontos/IC001/avaliacao").json()["total_avaliacoes"] == 2


def test_relato_vale_perto_de_qualquer_ponto_da_praia(client, estado):
    lat, lon = estado["IC001"]["coordenadas_terra_decimais"]
    r = client.post(
        "/praias/IC/relatos", json={"tipo": "lotada", "latitude": lat, "longitude": lon}, headers=AUTH
    )
    assert r.status_code == 204
    assert client.get("/praias/IC/relatos").json()["relatos"][0]["tipo"] == "lotada"


def test_migracao_junta_votos_antigos_na_praia():
    colecao = mongomock.MongoClient().db.votos
    colecao.insert_many(
        [
            {"praia_id": "IC003", "user_id": "u1", "votos": VOTOS, "timestamp": "2026-01-01T10:00:00+00:00"},
            {
                "praia_id": "IC001",
                "user_id": "u1",
                "votos": dict.fromkeys(VOTOS, 2.0),
                "timestamp": "2026-02-01T10:00:00+00:00",
            },
            {"praia_id": "IC002", "user_id": "u2", "votos": VOTOS, "timestamp": "2026-01-05T10:00:00+00:00"},
            {"praia_id": "GR", "user_id": "u3", "votos": VOTOS, "timestamp": "2026-03-01T10:00:00+00:00"},
        ]
    )
    repo = RepositorioVotos(colecao)
    repo.migrar_para_praias()
    repo.garantir_indices()
    assert colecao.count_documents({"praia_id": "IC"}) == 2
    # de quem avaliou dois pontos, fica a avaliação mais recente
    assert colecao.find_one({"praia_id": "IC", "user_id": "u1"})["votos"]["limpeza"] == 2.0
    assert colecao.count_documents({}) == 3
    assert repo.migrar_para_praias() == 0


def test_migracao_com_dois_processos_ao_mesmo_tempo_nao_perde_votos():
    from praiometro.relatos import _juntar_por_praia

    colecao = mongomock.MongoClient().db.votos
    colecao.insert_many(
        [
            {
                "praia_id": "AD000",
                "user_id": f"u{i}",
                "votos": VOTOS,
                "timestamp": f"2026-01-0{i}T10:00:00+00:00",
            }
            for i in range(1, 6)
        ]
    )
    RepositorioVotos(colecao).garantir_indices()
    # os dois processos leem a mesma lista antes de qualquer um mexer
    lista = list(colecao.find())
    _juntar_por_praia(colecao, ("user_id",), "timestamp", docs=[dict(d) for d in lista])
    _juntar_por_praia(colecao, ("user_id",), "timestamp", docs=[dict(d) for d in lista])
    assert colecao.count_documents({"praia_id": "AD"}) == 5
    assert colecao.count_documents({}) == 5


def test_migracao_dos_relatos():
    db = mongomock.MongoClient().db
    agora = datetime.now(UTC)
    db.relatos.insert_one(
        {"praia_id": "PR001", "tipo": "lotada", "user_id": "u1", "criado_em": agora, "expira_em": agora}
    )
    RepositorioRelatos(db).migrar_para_praias()
    assert db.relatos.find_one()["praia_id"] == "PR"
