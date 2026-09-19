"""Cliente da Open-Meteo (clima e mar)."""

import logging
from collections.abc import Sequence
from typing import Any

import requests

log = logging.getLogger(__name__)

METEO_VARIAVEIS = (
    "temperature_2m",
    "precipitation",
    "precipitation_probability",
    "rain",
    "relative_humidity_2m",
    "apparent_temperature",
    "wind_speed_10m",
    "wind_direction_10m",
    "uv_index",
    "weather_code",
)
MARINE_VARIAVEIS = ("wave_height", "wave_period", "sea_surface_temperature")
PREVISAO_VARIAVEIS = ("temperature_2m", "precipitation_probability", "weather_code", "uv_index")

Coordenada = Sequence[float]


def buscar_lote(
    sessao: requests.Session,
    url: str,
    coordenadas: Sequence[Coordenada],
    variaveis: Sequence[str],
    timezone: str,
    timeout: float = 20,
) -> list[dict[str, Any]]:
    """Busca a série horária de várias coordenadas numa só chamada.

    Retorna uma lista de dicionários "hourly", na mesma ordem das coordenadas.
    """
    params = {
        "latitude": ",".join(str(c[0]) for c in coordenadas),
        "longitude": ",".join(str(c[1]) for c in coordenadas),
        "hourly": ",".join(variaveis),
        "timezone": timezone,
        "past_days": 1,
        "forecast_days": 2,
    }
    resposta = sessao.get(url, params=params, timeout=timeout)
    resposta.raise_for_status()
    dados = resposta.json()
    if isinstance(dados, dict):
        if dados.get("error"):
            raise ValueError(f"Open-Meteo: {dados.get('reason')}")
        dados = [dados]
    if len(dados) != len(coordenadas):
        raise ValueError(f"Open-Meteo devolveu {len(dados)} séries para {len(coordenadas)} pontos")
    return [d.get("hourly") or {} for d in dados]


def _valor(serie: dict[str, Any], variavel: str, indice: int | None) -> Any:
    valores = serie.get(variavel) or []
    if indice is None or indice >= len(valores):
        return None
    return valores[indice]


def _indice(serie: dict[str, Any], chave_hora: str) -> int | None:
    tempos = serie.get("time") or []
    try:
        return tempos.index(chave_hora)
    except ValueError:
        return None


def extrair_leitura(meteo: dict[str, Any], marine: dict[str, Any], chave_hora: str) -> dict[str, Any] | None:
    """Monta a leitura da hora `chave_hora` (formato 'AAAA-MM-DDTHH:00').

    Retorna None quando não há dados meteorológicos para essa hora.
    """
    i = _indice(meteo, chave_hora)
    if i is None or _valor(meteo, "temperature_2m", i) is None:
        return None

    leitura: dict[str, Any] = {"timestamp": chave_hora}
    for v in METEO_VARIAVEIS:
        leitura[v] = _valor(meteo, v, i)

    j = _indice(marine, chave_hora)
    for v in MARINE_VARIAVEIS:
        leitura[v] = _valor(marine, v, j)

    precipitacao = (meteo.get("precipitation") or [])[max(0, i - 8) : i]
    leitura["choveu_8_horas"] = any((p or 0) > 0 for p in precipitacao)
    return leitura


def extrair_previsao(
    meteo: dict[str, Any], marine: dict[str, Any], chave_hora: str, horas: int
) -> list[dict[str, Any]]:
    """Lista com a previsão das próximas `horas` horas (sem incluir a atual)."""
    i = _indice(meteo, chave_hora)
    if i is None:
        return []
    tempos = meteo.get("time") or []
    previsao = []
    for k in range(i + 1, min(i + 1 + horas, len(tempos))):
        item = {"hora": tempos[k]}
        for v in PREVISAO_VARIAVEIS:
            item[v] = _valor(meteo, v, k)
        item["wave_height"] = _valor(marine, "wave_height", _indice(marine, tempos[k]))
        previsao.append(item)
    return previsao
