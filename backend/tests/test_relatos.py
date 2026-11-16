from datetime import UTC, datetime, timedelta

import mongomock
import pytest

from praiometro.relatos import RegrasRelatos, RelatoRecusadoError, RepositorioRelatos, distancia_km

PRAIA = (-22.905, -43.117)  # Icaraí
NA_PRAIA = (-22.906, -43.118)
LONGE = (-22.976, -43.031)  # Itacoatiara
AGORA = datetime(2026, 11, 16, 15, 0, tzinfo=UTC)
AUTH = {"Authorization": "Bearer valido-u1"}


@pytest.fixture
def relatos():
    return RepositorioRelatos(mongomock.MongoClient().db)


def test_distancia():
    assert distancia_km(*PRAIA, *NA_PRAIA) < 0.2
    assert 11 < distancia_km(*PRAIA, *LONGE) < 12.5


def test_relatar_e_confirmar(relatos):
    relatos.registrar("IC", "u1", "lotada", NA_PRAIA, [PRAIA], agora=AGORA)
    relatos.registrar("IC", "u2", "lotada", NA_PRAIA, [PRAIA], agora=AGORA + timedelta(minutes=10))
    relatos.registrar("IC", "u3", "agua_viva", NA_PRAIA, [PRAIA], agora=AGORA + timedelta(minutes=20))
    lista = relatos.listar("IC", agora=AGORA + timedelta(minutes=30))
    assert [(r["tipo"], r["confirmacoes"]) for r in lista] == [("lotada", 2), ("agua_viva", 1)]
    assert lista[0]["rotulo"] == "Lotada"
    assert relatos.listar("GR000", agora=AGORA) == []


def test_relato_expira(relatos):
    relatos.registrar("IC", "u1", "lotada", NA_PRAIA, [PRAIA], agora=AGORA)
    assert relatos.listar("IC", agora=AGORA + timedelta(hours=4, minutes=59))
    assert relatos.listar("IC", agora=AGORA + timedelta(hours=5, minutes=1)) == []


def test_mesmo_usuario_nao_duplica(relatos):
    for minutos in (0, 5, 30):
        relatos.registrar("IC", "u1", "lotada", NA_PRAIA, [PRAIA], agora=AGORA + timedelta(minutes=minutos))
    assert relatos.listar("IC", agora=AGORA + timedelta(minutes=40))[0]["confirmacoes"] == 1
    assert relatos.relatos.count_documents({}) == 1


def test_longe_da_praia_e_recusado(relatos):
    with pytest.raises(RelatoRecusadoError) as erro:
        relatos.registrar("IC", "u1", "lotada", LONGE, [PRAIA], agora=AGORA)
    assert erro.value.status == 403


def test_tipo_invalido(relatos):
    with pytest.raises(RelatoRecusadoError):
        relatos.registrar("IC", "u1", "tubarao", NA_PRAIA, [PRAIA], agora=AGORA)
    with pytest.raises(RelatoRecusadoError):
        relatos.denunciar("IC", "u1", "tubarao", agora=AGORA)


def test_limite_diario():
    relatos = RepositorioRelatos(mongomock.MongoClient().db, RegrasRelatos(maximo_por_dia=5))
    tipos = ["lotada", "agua_limpa", "agua_viva", "lixo", "mar_agitado"]
    for i, tipo in enumerate(tipos):
        relatos.registrar("IC", "u1", tipo, NA_PRAIA, [PRAIA], agora=AGORA + timedelta(minutes=i))
    with pytest.raises(RelatoRecusadoError) as erro:
        relatos.registrar("IC", "u1", "agua_turva", NA_PRAIA, [PRAIA], agora=AGORA + timedelta(minutes=10))
    assert erro.value.status == 429
    relatos.registrar(
        "IC", "u1", "agua_turva", NA_PRAIA, [PRAIA], agora=AGORA + timedelta(days=1, minutes=10)
    )


def test_denuncias_escondem_relato_falso(relatos):
    relatos.registrar("IC", "u1", "bandeira_vermelha", NA_PRAIA, [PRAIA], agora=AGORA)
    for usuario in ("d1", "d2"):
        relatos.denunciar("IC", usuario, "bandeira_vermelha", agora=AGORA)
    assert relatos.listar("IC", agora=AGORA)  # 2 denúncias ainda não bastam
    relatos.denunciar("IC", "d3", "bandeira_vermelha", agora=AGORA)
    assert relatos.listar("IC", agora=AGORA) == []


def test_confirmacoes_protegem_contra_denuncias(relatos):
    for usuario in ("u1", "u2", "u3", "u4"):
        relatos.registrar("IC", usuario, "lotada", NA_PRAIA, [PRAIA], agora=AGORA)
    for usuario in ("d1", "d2", "d3"):
        relatos.denunciar("IC", usuario, "lotada", agora=AGORA)
    assert relatos.listar("IC", agora=AGORA)[0]["confirmacoes"] == 4


# ------------------------------------------------------------------ API


def test_api_fluxo_completo(client):
    assert client.get("/pontos/IC001/relatos").json() == {"relatos": [], "disponivel": True}
    corpo = {"tipo": "agua_viva", "latitude": -22.911, "longitude": -43.111}
    assert client.post("/pontos/IC001/relatos", json=corpo, headers=AUTH).status_code == 204
    lista = client.get("/pontos/IC001/relatos").json()["relatos"]
    assert lista[0]["tipo"] == "agua_viva"
    assert lista[0]["confirmacoes"] == 1
    assert client.post("/pontos/IC001/relatos/agua_viva/denuncia", headers=AUTH).status_code == 204


def test_api_exige_login(client):
    corpo = {"tipo": "lotada", "latitude": -22.911, "longitude": -43.111}
    assert client.post("/pontos/IC001/relatos", json=corpo).status_code == 401
    r = client.post("/pontos/IC001/relatos", json=corpo, headers={"Authorization": "Bearer lixo"})
    assert r.status_code == 401


def test_api_longe_da_praia(client):
    corpo = {"tipo": "lotada", "latitude": LONGE[0], "longitude": LONGE[1]}
    r = client.post("/pontos/IC001/relatos", json=corpo, headers=AUTH)
    assert r.status_code == 403
    assert r.json()["detail"] == "Você precisa estar na praia para relatar."


def test_api_dados_invalidos(client):
    for corpo in (
        {"tipo": "tubarao", "latitude": -22.911, "longitude": -43.111},
        {"tipo": "lotada", "latitude": 200, "longitude": -43.111},
        {"tipo": "lotada"},
    ):
        assert client.post("/pontos/IC001/relatos", json=corpo, headers=AUTH).status_code in (400, 422)
    assert (
        client.post(
            "/pontos/XX999/relatos", json={"tipo": "lotada", "latitude": 0, "longitude": 0}, headers=AUTH
        ).status_code
        == 404
    )
    assert client.get("/pontos/XX999/relatos").status_code == 404


def test_varios_relatos_de_uma_vez(relatos):
    relatos.registrar("IC", "u1", ["lotada", "agua_viva", "lixo"], NA_PRAIA, [PRAIA], agora=AGORA)
    assert {r["tipo"] for r in relatos.listar("IC", agora=AGORA)} == {"lotada", "agua_viva", "lixo"}


def test_opcoes_opostas_nao_vao_juntas(relatos):
    with pytest.raises(RelatoRecusadoError):
        relatos.registrar("IC", "u1", ["lotada", "tranquila"], NA_PRAIA, [PRAIA], agora=AGORA)
    with pytest.raises(RelatoRecusadoError):
        relatos.registrar("IC", "u1", ["agua_limpa", "agua_turva"], NA_PRAIA, [PRAIA], agora=AGORA)
    assert relatos.listar("IC", agora=AGORA) == []


def test_varios_pela_api(client, estado):
    lat, lon = estado["IC001"]["coordenadas_terra_decimais"]
    corpo = {"tipos": ["agua_limpa", "tranquila"], "latitude": lat, "longitude": lon}
    assert client.post("/praias/IC/relatos", json=corpo, headers=AUTH).status_code == 204
    tipos = {r["tipo"] for r in client.get("/praias/IC/relatos").json()["relatos"]}
    assert tipos == {"agua_limpa", "tranquila"}
    sem_tipo = {"tipos": [], "latitude": lat, "longitude": lon}
    assert client.post("/praias/IC/relatos", json=sem_tipo, headers=AUTH).status_code == 400
