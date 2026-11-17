from unittest.mock import MagicMock

import pytest

from praiometro.coleta import open_meteo


def _serie(horas, **variaveis):
    return {"time": horas, **variaveis}


HORAS = [f"2026-01-10T{h:02d}:00" for h in range(24)]


def test_extrair_leitura_basica():
    meteo = _serie(HORAS, temperature_2m=list(range(24)), precipitation=[0] * 24, weather_code=[1] * 24)
    marine = _serie(HORAS, wave_height=[0.5] * 24, wave_period=[7] * 24)
    leitura = open_meteo.extrair_leitura(meteo, marine, "2026-01-10T10:00")
    assert leitura["temperature_2m"] == 10
    assert leitura["wave_height"] == 0.5
    assert leitura["choveu_8_horas"] is False
    assert leitura["uv_index"] is None  # variável ausente não quebra


def test_choveu_nas_ultimas_8_horas():
    chuva = [0] * 24
    chuva[5] = 1.2
    meteo = _serie(HORAS, temperature_2m=[20] * 24, precipitation=chuva)
    assert open_meteo.extrair_leitura(meteo, {}, "2026-01-10T10:00")["choveu_8_horas"] is True
    assert open_meteo.extrair_leitura(meteo, {}, "2026-01-10T20:00")["choveu_8_horas"] is False


def test_falha_marinha_nao_derruba_leitura():
    meteo = _serie(HORAS, temperature_2m=[20] * 24)
    leitura = open_meteo.extrair_leitura(meteo, {}, "2026-01-10T15:00")
    assert leitura["temperature_2m"] == 20
    assert leitura["wave_height"] is None


def test_eixos_de_tempo_diferentes_entre_meteo_e_marine():
    meteo = _serie(HORAS, temperature_2m=[20] * 24)
    marine = _serie(HORAS[5:], wave_height=[float(i) for i in range(19)])
    leitura = open_meteo.extrair_leitura(meteo, marine, "2026-01-10T07:00")
    assert leitura["wave_height"] == 2.0


def test_hora_inexistente_retorna_none():
    meteo = _serie(HORAS, temperature_2m=[20] * 24)
    assert open_meteo.extrair_leitura(meteo, {}, "2030-01-01T00:00") is None
    assert open_meteo.extrair_leitura({}, {}, "2026-01-10T10:00") is None


def test_previsao():
    meteo = _serie(HORAS, temperature_2m=list(range(24)), weather_code=[3] * 24)
    marine = _serie(HORAS, wave_height=[1.0] * 24)
    previsao = open_meteo.extrair_previsao(meteo, marine, "2026-01-10T20:00", horas=12)
    assert [p["hora"] for p in previsao] == HORAS[21:]
    assert previsao[0]["temperature_2m"] == 21
    assert previsao[0]["wave_height"] == 1.0


def _sessao(json_resposta):
    resposta = MagicMock(status_code=200)
    resposta.json.return_value = json_resposta
    sessao = MagicMock()
    sessao.get.return_value = resposta
    return sessao


def test_buscar_lote_varias_coordenadas_em_uma_chamada():
    sessao = _sessao([{"hourly": {"time": ["a"]}}, {"hourly": {"time": ["b"]}}])
    series = open_meteo.buscar_lote(
        sessao, "url", [(-22.9, -43.1), (-22.8, -43.0)], ["x"], "America/Sao_Paulo"
    )
    assert series == [{"time": ["a"]}, {"time": ["b"]}]
    params = sessao.get.call_args.kwargs["params"]
    assert params["latitude"] == "-22.9,-22.8"
    assert params["past_days"] == 1
    assert sessao.get.call_count == 1


def test_buscar_lote_um_ponto_retorna_dict():
    sessao = _sessao({"hourly": {"time": ["a"]}})
    assert open_meteo.buscar_lote(sessao, "url", [(-22.9, -43.1)], ["x"], "UTC") == [{"time": ["a"]}]


def test_buscar_lote_quantidade_errada():
    sessao = _sessao([{"hourly": {}}])
    with pytest.raises(ValueError):
        open_meteo.buscar_lote(sessao, "url", [(1, 1), (2, 2)], ["x"], "UTC")


def test_buscar_lote_erro_da_api():
    sessao = _sessao({"error": True, "reason": "Parâmetro inválido"})
    with pytest.raises(ValueError, match="Parâmetro inválido"):
        open_meteo.buscar_lote(sessao, "url", [(1, 1)], ["x"], "UTC")


def test_limite_de_acessos_vira_erro_com_o_motivo():
    from unittest.mock import MagicMock

    import pytest

    resposta = MagicMock(status_code=429, reason="Too Many Requests")
    resposta.json.return_value = {"error": True, "reason": "Daily API request limit exceeded."}
    sessao = MagicMock()
    sessao.get.return_value = resposta
    with pytest.raises(ValueError, match="429: Daily API request limit exceeded"):
        open_meteo.buscar_lote(sessao, "https://x", [(-22.9, -43.1)], ["temperature_2m"], "America/Sao_Paulo")


def test_sessao_nao_espera_o_tempo_que_o_servidor_mandar():
    from praiometro.coleta.http import criar_sessao

    tentativas = criar_sessao().get_adapter("https://x").max_retries
    assert tentativas.respect_retry_after_header is False
    assert tentativas.total <= 2


def test_coleta_pela_ponte_manda_o_endereco_inteiro_e_a_chave():
    from unittest.mock import patch

    import requests

    from praiometro.coleta.http import SessaoPelaPonte, criar_sessao

    sessao = criar_sessao(ponte_url="https://ponte.exemplo/api/buscar", ponte_chave="segredo")
    assert isinstance(sessao, SessaoPelaPonte)
    with patch.object(requests.Session, "get", return_value="resposta") as get:
        assert sessao.get(
            "https://api.open-meteo.com/v1/forecast", params={"latitude": "-22.9,-23"}, timeout=20
        )
    (destino,), opcoes = get.call_args
    assert destino == "https://ponte.exemplo/api/buscar"
    assert opcoes["params"] == {"url": "https://api.open-meteo.com/v1/forecast?latitude=-22.9%2C-23"}
    assert opcoes["headers"] == {"x-ponte-chave": "segredo"}
    assert opcoes["timeout"] == 30


def test_sem_ponte_a_coleta_vai_direto():
    from praiometro.coleta.http import SessaoPelaPonte, criar_sessao

    assert not isinstance(criar_sessao(), SessaoPelaPonte)
