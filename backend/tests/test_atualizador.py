import json
from datetime import datetime
from unittest.mock import patch
from zoneinfo import ZoneInfo

from praiometro.coleta import inea
from praiometro.coleta.atualizador import chave_hora_atual, executar_coleta, mesclar_estado

CATALOGO = {
    "AA000": {"nome": ["Praia A"], "coordenadas_decimais": [1, 1]},
    "BB000": {"nome": ["Praia B"], "coordenadas_decimais": [2, 2], "codigo_inea": "BB001"},
}


def test_chave_hora_atual():
    agora = datetime(2026, 1, 10, 14, 37, tzinfo=ZoneInfo("America/Sao_Paulo"))
    assert chave_hora_atual("America/Sao_Paulo", agora) == "2026-01-10T14:00"


def test_mesclar_mantem_leitura_anterior_quando_falha():
    anterior = {"AA000": {"leitura_atual": {"timestamp": "velho", "balneabilidade": True}}}
    novo = mesclar_estado(CATALOGO, anterior, {"AA000": None, "BB000": None}, {}, {})
    assert novo["AA000"]["leitura_atual"]["timestamp"] == "velho"
    assert novo["BB000"]["leitura_atual"] == {}


def test_mesclar_usa_codigo_inea_e_fallback_de_balneabilidade():
    anterior = {"AA000": {"leitura_atual": {"balneabilidade": False}}}
    leituras = {"AA000": {"timestamp": "t"}, "BB000": {"timestamp": "t"}}
    novo = mesclar_estado(CATALOGO, anterior, leituras, {}, {"BB001": True})
    assert novo["AA000"]["leitura_atual"]["balneabilidade"] is False  # não veio no boletim
    assert novo["BB000"]["leitura_atual"]["balneabilidade"] is True  # mapeado via codigo_inea


def test_mesclar_preserva_avaliacoes_e_atualiza_catalogo():
    anterior = {"AA000": {"nome": ["Nome antigo"], "avaliacao_media": {"limpeza": 4}, "total_avaliacoes": 3}}
    novo = mesclar_estado(CATALOGO, anterior, {"AA000": {"timestamp": "t"}}, {}, {})
    assert novo["AA000"]["nome"] == ["Praia A"]
    assert novo["AA000"]["avaliacao_media"] == {"limpeza": 4}
    assert novo["AA000"]["total_avaliacoes"] == 3


def test_executar_coleta_ponta_a_ponta(settings):
    horas = [f"2026-01-10T{h:02d}:00" for h in range(24)]
    serie = {"time": horas, "temperature_2m": [25.0] * 24, "precipitation": [0] * 24}
    with (
        patch("praiometro.coleta.atualizador.chave_hora_atual", return_value="2026-01-10T12:00"),
        patch("praiometro.coleta.open_meteo.buscar_lote", side_effect=lambda *a, **k: [serie] * len(a[2])),
        patch("praiometro.coleta.inea.baixar_boletim", return_value=False),
        patch("praiometro.coleta.inea.ler_boletim", return_value=inea.Boletim(status={"GR000": True})),
    ):
        estado = executar_coleta(settings, sessao=object())
    assert len(estado) == 68
    assert estado["GR000"]["leitura_atual"]["temperature_2m"] == 25.0
    assert estado["GR000"]["leitura_atual"]["balneabilidade"] is True
    assert len(estado["GR000"]["previsao"]) == 11  # limitado pelo fim da série de teste
    assert json.loads(settings.estado_file.read_text(encoding="utf-8")) == estado


def test_data_do_boletim_acompanha_a_balneabilidade():
    anterior = {"AA000": {"leitura_atual": {"balneabilidade": False, "balneabilidade_data": "2026-11-01"}}}
    leituras = {"AA000": {"timestamp": "t"}, "BB000": {"timestamp": "t"}}
    novo = mesclar_estado(CATALOGO, anterior, leituras, {}, {"BB001": True}, "2026-11-12")
    # AA000 não veio no boletim novo: mantém status e data antigos
    assert novo["AA000"]["leitura_atual"]["balneabilidade_data"] == "2026-11-01"
    assert novo["BB000"]["leitura_atual"]["balneabilidade_data"] == "2026-11-12"


def test_praias_da_baia_ficam_sem_dados_de_onda(settings):
    horas = [f"2026-01-10T{h:02d}:00" for h in range(24)]
    meteo = {"time": horas, "temperature_2m": [25.0] * 24, "precipitation": [0] * 24}
    mar = {"time": horas, "wave_height": [1.0] * 24, "wave_period": [9.0] * 24}

    def buscar_lote(_sessao, url, coordenadas, *_a, **_k):
        return [mar if "marine" in url else meteo] * len(coordenadas)

    with (
        patch("praiometro.coleta.atualizador.chave_hora_atual", return_value="2026-01-10T12:00"),
        patch("praiometro.coleta.open_meteo.buscar_lote", side_effect=buscar_lote),
        patch("praiometro.coleta.inea.baixar_boletim", return_value=False),
    ):
        estado = executar_coleta(settings, sessao=object())
    assert estado["CH000"]["mar"] == "baia"
    assert estado["CH000"]["leitura_atual"]["wave_height"] is None
    assert estado["CH000"]["previsao"][0]["wave_height"] is None
    assert estado["IA000"]["leitura_atual"]["wave_height"] == 1.0


def test_clima_em_terra_e_mar_na_agua(settings):
    chamadas = {}

    def buscar_lote(_sessao, url, coordenadas, *_a, **_k):
        chamadas["marine" if "marine" in url else "meteo"] = coordenadas
        return [{} for _ in coordenadas]

    with (
        patch("praiometro.coleta.open_meteo.buscar_lote", side_effect=buscar_lote),
        patch("praiometro.coleta.inea.baixar_boletim", return_value=False),
    ):
        executar_coleta(settings, sessao=object())
    catalogo = json.loads(settings.catalogo_file.read_text(encoding="utf-8"))
    primeiro = next(iter(catalogo.values()))
    assert chamadas["meteo"][0] == primeiro["coordenadas_terra_decimais"]
    assert chamadas["marine"][0] == primeiro["coordenadas_decimais"]


def test_cada_cidade_usa_o_proprio_boletim(settings):
    from datetime import date

    horas = [f"2026-01-10T{h:02d}:00" for h in range(24)]
    serie = {"time": horas, "temperature_2m": [25.0] * 24, "precipitation": [0] * 24}

    def ler(pdf):
        if "rio" in pdf.name:
            return inea.Boletim(data=date(2026, 11, 11), status={"CP004": True})
        return inea.Boletim(data=date(2026, 11, 12), status={"GR000": False})

    with (
        patch("praiometro.coleta.atualizador.chave_hora_atual", return_value="2026-01-10T12:00"),
        patch("praiometro.coleta.open_meteo.buscar_lote", side_effect=lambda *a, **k: [serie] * len(a[2])),
        patch("praiometro.coleta.inea.baixar_boletim", return_value=False) as baixar,
        patch("praiometro.coleta.inea.ler_boletim", side_effect=ler),
    ):
        estado = executar_coleta(settings, sessao=object())
    paginas = [c.args[1] for c in baixar.call_args_list]
    assert paginas == [settings.inea_url, settings.inea_rio_url]
    assert estado["CP004"]["leitura_atual"]["balneabilidade"] is True
    assert estado["CP004"]["leitura_atual"]["balneabilidade_data"] == "2026-11-11"
    assert estado["GR000"]["leitura_atual"]["balneabilidade_data"] == "2026-11-12"
