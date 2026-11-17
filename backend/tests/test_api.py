import json
from unittest.mock import patch

import mongomock
from fastapi.testclient import TestClient

from praiometro.api.app import create_app
from praiometro.api.ratelimit import LimitadorTaxa
from praiometro.relatos import RepositorioRelatos

from .conftest import verificador_falso

VOTOS = {"limpeza": 5, "acessibilidade": 4, "infraestrutura": 3, "seguranca": 2, "tranquilidade": 1}
AUTH = {"Authorization": "Bearer valido-usuario1"}


def test_health(client):
    r = client.get("/health")
    assert r.status_code == 200
    corpo = r.json()
    assert corpo["status"] == "ok"
    assert corpo["pontos"] == 68


def test_listar_pontos_inclui_balneabilidade(client):
    r = client.get("/pontos")
    assert r.status_code == 200
    pontos = {p["codigo"]: p for p in r.json()["pontos"]}
    assert len(pontos) == 68
    assert pontos["GR000"]["nome"] == ["Praia de Gragoatá"]
    assert pontos["GR000"]["balneabilidade"] is True
    assert pontos["GR000"]["ultima_leitura"] == "2026-01-10T14:00"
    assert pontos["GR000"]["mar"] == "baia"
    assert pontos["IA000"]["mar"] == "oceanico"


def test_pontos_seguem_o_litoral(client):
    pontos = client.get("/pontos").json()["pontos"]
    assert [p["ordem"] for p in pontos] == list(range(len(pontos)))
    codigos = [p["codigo"] for p in pontos]
    # Jurujuba vem depois de Charitas e antes de Adão e Eva; Itacoatiara fecha Niterói
    assert codigos.index("CH000") < codigos.index("JR000") < codigos.index("AD000")
    assert codigos[0] == "GR000" and codigos[28].startswith("IA")
    # no Rio, de Guaratiba à Glória
    assert codigos[29] == "BG000" and codigos[-1] == "FL008"
    assert codigos.index("IP003") < codigos.index("CP004") < codigos.index("LM002")


def test_nome_de_charitas_corrigido(client):
    nomes = {p["codigo"]: p["nome"][0] for p in client.get("/pontos").json()["pontos"]}
    assert nomes["CH000"] == "Praia de Charitas"


def test_detalhar_ponto(client):
    r = client.get("/pontos/GR000")
    assert r.status_code == 200
    assert r.json()["leitura_atual"]["temperature_2m"] == 29.1


def test_ponto_inexistente_retorna_404(client):
    assert client.get("/pontos/XX999").status_code == 404
    assert client.get("/pontos/XX999/avaliacao").status_code == 404


def test_dados_filtrados(client):
    r = client.get("/pontos/GR000/dados", params={"tipo": "marine"})
    assert r.status_code == 200
    dados = r.json()["dados"]
    assert set(dados) == {"wave_height", "wave_period", "balneabilidade"}


def test_dados_tipo_invalido(client):
    assert client.get("/pontos/GR000/dados", params={"tipo": "xpto"}).status_code == 422


def test_avaliacao_sem_votos_retorna_200_com_null(client):
    r = client.get("/praias/GR/avaliacao")
    assert r.status_code == 200
    assert r.json() == {
        "praia_id": "GR",
        "avaliacao_media": None,
        "medias_exatas": None,
        "nota_geral": None,
        "total_avaliacoes": 0,
    }


def test_votar_e_ver_media_na_hora(client):
    r = client.post("/votar", params={"praia_id": "GR000"}, json=VOTOS, headers=AUTH)
    assert r.status_code == 200
    assert r.json()["votou"] is False

    r = client.get("/pontos/GR000/avaliacao").json()
    assert r["total_avaliacoes"] == 1
    assert r["avaliacao_media"] == VOTOS


def test_media_de_varios_votos(client):
    for i, nota in enumerate([5, 4, 4]):
        votos = dict.fromkeys(VOTOS, nota)
        headers = {"Authorization": f"Bearer valido-u{i}"}
        assert (
            client.post("/votar", params={"praia_id": "BV001"}, json=votos, headers=headers).status_code
            == 200
        )
    r = client.get("/pontos/BV001/avaliacao").json()
    assert r["total_avaliacoes"] == 3
    assert r["medias_exatas"]["limpeza"] == 4.33
    assert r["avaliacao_media"]["limpeza"] == 4.5


def test_segundo_voto_em_menos_de_30_dias_nao_e_registrado(client):
    client.app.state.settings.dias_entre_votos = 30
    client.post("/votar", params={"praia_id": "GR000"}, json=VOTOS, headers=AUTH)
    outro = dict.fromkeys(VOTOS, 1)
    r = client.post("/votar", params={"praia_id": "GR000"}, json=outro, headers=AUTH)
    assert r.status_code == 200
    assert r.json()["votou"] is True
    assert r.json()["pode_votar_em"]
    assert client.get("/pontos/GR000/avaliacao").json()["avaliacao_media"] == VOTOS


def test_token_legado_por_query_ainda_funciona(client):
    r = client.post("/votar", params={"praia_id": "GR000", "token": "valido-antigo"}, json=VOTOS)
    assert r.status_code == 200


def test_votar_sem_token(client):
    r = client.post("/votar", params={"praia_id": "GR000"}, json=VOTOS)
    assert r.status_code == 401


def test_votar_token_invalido(client):
    r = client.post(
        "/votar", params={"praia_id": "GR000"}, json=VOTOS, headers={"Authorization": "Bearer lixo"}
    )
    assert r.status_code == 401


def test_votar_praia_inexistente(client):
    assert client.post("/votar", params={"praia_id": "XX999"}, json=VOTOS, headers=AUTH).status_code == 404


def test_votos_invalidos_sao_rejeitados_sem_apagar_voto_anterior(client, colecao):
    client.post("/votar", params={"praia_id": "GR000"}, json=VOTOS, headers=AUTH)
    invalidos = [
        {**VOTOS, "limpeza": 6},
        {**VOTOS, "limpeza": 0},
        {**VOTOS, "limpeza": True},
        {**VOTOS, "limpeza": "5"},
        {**VOTOS, "limpeza": 4.3},
        {k: v for k, v in VOTOS.items() if k != "limpeza"},
        {**VOTOS, "extra": 3},
    ]
    for votos in invalidos:
        r = client.post("/votar", params={"praia_id": "GR000"}, json=votos, headers=AUTH)
        assert r.status_code == 422, votos
        assert isinstance(r.json()["detail"], str)
    assert colecao.count_documents({"praia_id": "GR"}) == 1


def test_rate_limit(client):
    client.app.state.limitador = LimitadorTaxa(maximo=2)
    codigos = [
        client.post("/votar", params={"praia_id": "GR000"}, json=VOTOS, headers=AUTH).status_code
        for _ in range(3)
    ]
    assert codigos == [200, 200, 429]


def test_cache_recarrega_quando_arquivo_muda(client, settings, estado):
    client.app.state.cache.intervalo = 0
    estado["GR000"]["leitura_atual"]["temperature_2m"] = 35.5
    settings.estado_file.write_text(json.dumps(estado), encoding="utf-8")
    import os

    st = settings.estado_file.stat()
    os.utime(settings.estado_file, (st.st_atime, st.st_mtime + 10))
    assert client.get("/pontos/GR000").json()["leitura_atual"]["temperature_2m"] == 35.5


def test_sem_estado_usa_catalogo(settings, repo):
    from fastapi.testclient import TestClient

    from praiometro.api.app import create_app

    with TestClient(create_app(settings, repo=repo, verificador=lambda t: t)) as c:
        pontos = c.get("/pontos").json()["pontos"]
        assert len(pontos) == 68
        assert pontos[0]["ultima_leitura"] is None


def test_notificar_atualizacao_aceita_localhost(client):
    assert client.post("/notificar-atualizacao").status_code == 200


def test_meia_estrela(client):
    votos = {**VOTOS, "limpeza": 4.5, "seguranca": 0.5}
    assert client.post("/votar", params={"praia_id": "GR000"}, json=votos, headers=AUTH).status_code == 200
    r = client.get("/pontos/GR000/avaliacao").json()
    assert r["avaliacao_media"]["limpeza"] == 4.5
    assert r["avaliacao_media"]["seguranca"] == 0.5
    assert r["nota_geral"] == round((4.5 + 4 + 3 + 0.5 + 1) / 5, 2)


def test_meia_estrela_invalida(client):
    for nota in (4.3, 0, 5.5):
        votos = {**VOTOS, "limpeza": nota}
        assert (
            client.post("/votar", params={"praia_id": "GR000"}, json=votos, headers=AUTH).status_code == 422
        )


def test_media_arredonda_para_meia_estrela(client):
    for i, nota in enumerate([5, 4, 4]):
        headers = {"Authorization": f"Bearer valido-m{i}"}
        client.post("/votar", params={"praia_id": "CH000"}, json=dict.fromkeys(VOTOS, nota), headers=headers)
    r = client.get("/pontos/CH000/avaliacao").json()
    assert r["medias_exatas"]["limpeza"] == 4.33
    assert r["avaliacao_media"]["limpeza"] == 4.5


def test_usuario_pode_atualizar_avaliacao(client, colecao):
    client.post("/votar", params={"praia_id": "GR000"}, json=VOTOS, headers=AUTH)
    novos = dict.fromkeys(VOTOS, 2)
    r = client.post("/votar", params={"praia_id": "GR000"}, json=novos, headers=AUTH).json()
    assert r["votou"] is False
    assert r["atualizado"] is True
    assert colecao.count_documents({"praia_id": "GR"}) == 1
    assert client.get("/pontos/GR000/avaliacao").json()["avaliacao_media"] == novos


# ---------------------------------------------------------------- falhas


class RepoQuebrado:
    def __getattr__(self, nome):
        from pymongo.errors import ServerSelectionTimeoutError

        def falhar(*_a, **_k):
            raise ServerSelectionTimeoutError("mongo fora")

        return falhar

    def ping(self):
        return False


def _cliente(settings, repo, relatos=None):
    from fastapi.testclient import TestClient

    from praiometro.api.app import create_app

    return TestClient(
        create_app(
            settings,
            repo=repo,
            verificador=lambda t: "u",
            relatos=relatos or RepositorioRelatos(mongomock.MongoClient().db),
        ),
        raise_server_exceptions=False,
    )


def test_mongo_fora_do_ar(settings, estado):
    estado["GR000"]["avaliacao_media"] = {"limpeza": 4}
    settings.estado_file.write_text(json.dumps(estado), encoding="utf-8")
    with _cliente(settings, RepoQuebrado(), relatos=RepoQuebrado()) as c:
        assert c.get("/health").json()["mongo"] is False
        assert c.get("/pontos").status_code == 200
        r = c.get("/pontos/GR000/avaliacao")
        assert r.status_code == 200
        assert r.json()["avaliacao_media"] == {"limpeza": 4}
        r = c.post("/votar", params={"praia_id": "GR000"}, json=VOTOS, headers=AUTH)
        assert r.status_code == 503
        assert "detail" in r.json()
        # relatos também dependem do Mongo: a leitura avisa em vez de quebrar
        assert c.get("/pontos/GR000/relatos").json() == {"relatos": [], "disponivel": False}


def test_estado_corrompido_usa_catalogo(settings, repo):
    settings.estado_file.parent.mkdir(parents=True, exist_ok=True)
    settings.estado_file.write_text("{ isto não é json", encoding="utf-8")
    with _cliente(settings, repo) as c:
        r = c.get("/pontos")
        assert r.status_code == 200
        assert len(r.json()["pontos"]) == 68


def test_estado_corrompido_depois_mantem_cache(client, settings):
    client.app.state.cache.intervalo = 0
    settings.estado_file.write_text("corrompido", encoding="utf-8")
    import os

    st = settings.estado_file.stat()
    os.utime(settings.estado_file, (st.st_atime, st.st_mtime + 10))
    r = client.get("/pontos/GR000")
    assert r.status_code == 200
    assert r.json()["leitura_atual"]["temperature_2m"] == 29.1


def test_erro_inesperado_retorna_json_amigavel(settings, estado):
    class RepoBug:
        def garantir_indices(self):
            pass

        def resumo(self, _):
            raise RuntimeError("bug")

    with _cliente(settings, RepoBug()) as c:
        r = c.get("/pontos/GR000/avaliacao")
        assert r.status_code == 500
        assert r.json()["detail"].startswith("Erro interno")


def test_ponto_sem_leitura_nao_quebra(settings, repo):
    catalogo = json.loads(settings.catalogo_file.read_text(encoding="utf-8"))
    settings.estado_file.parent.mkdir(parents=True, exist_ok=True)
    settings.estado_file.write_text(json.dumps({"GR000": {**catalogo["GR000"], "leitura_atual": {}}}))
    with _cliente(settings, repo) as c:
        assert c.get("/pontos").json()["pontos"][0]["balneabilidade"] is None
        assert c.get("/pontos/GR000/dados").json()["dados"] == {}


def test_estado_vazio_cai_no_catalogo(client, settings):
    client.app.state.cache.intervalo = 0
    settings.estado_file.write_text("{}", encoding="utf-8")
    import os

    st = settings.estado_file.stat()
    os.utime(settings.estado_file, (st.st_atime, st.st_mtime + 10))
    client.app.state.cache.recarregar(forcar=True)
    assert len(client.get("/pontos").json()["pontos"]) == 68


def test_codigo_do_ponto_sem_diferenciar_maiusculas(client):
    assert client.get("/pontos/gr000").status_code == 200
    assert client.get("/pontos/zz999").status_code == 404


def test_coletor_embutido_roda_junto_com_a_api(settings, estado, repo):
    settings.coletor_embutido = True
    with patch("praiometro.api.app.rodar_coletor") as coletor:
        app = create_app(settings, repo=repo, verificador=verificador_falso)
        with TestClient(app) as c:
            assert c.get("/health").status_code == 200
            parar = coletor.call_args.kwargs["parar"]
            assert coletor.call_args.kwargs["settings"] is settings
            assert not parar.is_set()
        # ao desligar a API, a coleta para
        assert parar.is_set()


def test_sem_coletor_embutido_a_api_nao_coleta(client):
    with patch("praiometro.api.app.rodar_coletor") as coletor, TestClient(client.app):
        pass
    coletor.assert_not_called()


def test_health_diz_se_a_coleta_ja_rodou(client, settings):
    saude = client.get("/health").json()
    assert saude["coleta_embutida"] is False
    assert saude["ultima_coleta"] is not None
    assert saude["pontos_com_leitura"] == 68
    assert saude["pontos_com_boletim"] == 68
    # sem o arquivo de estado, só o catálogo: nada foi coletado ainda
    settings.estado_file.unlink()
    client.app.state.cache.recarregar(forcar=True)
    saude = client.get("/health").json()
    assert saude["ultima_coleta"] is None
    assert saude["pontos"] == 68
    assert saude["pontos_com_leitura"] == 0
