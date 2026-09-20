"""Dados regionais de Niterói: maré e nascer/pôr do sol (Open-Meteo)."""

import logging
from datetime import datetime, timedelta
from typing import Any

import requests

log = logging.getLogger(__name__)

# boca da baía, entre Jurujuba e o Forte de Copacabana
PONTO_MARE = (-22.955, -43.13)
PONTO_SOL = (-22.91, -43.10)


def extremos_mare(horas: list[str], niveis: list[float | None]) -> list[dict[str, Any]]:
    """Máximos e mínimos locais da série horária, refinados por uma parábola."""
    extremos = []
    for i in range(1, len(niveis) - 1):
        a, b, c = niveis[i - 1], niveis[i], niveis[i + 1]
        if a is None or b is None or c is None:
            continue
        alta = b >= a and b > c
        baixa = b <= a and b < c
        if not (alta or baixa):
            continue
        curvatura = a - 2 * b + c
        desloc = 0.5 * (a - c) / curvatura if curvatura else 0.0
        desloc = max(-0.5, min(0.5, desloc))
        nivel = b - 0.25 * (a - c) * desloc
        hora = datetime.fromisoformat(horas[i])
        minutos = hora.hour * 60 + hora.minute + round(desloc * 60)
        hora = hora.replace(hour=0, minute=0) + timedelta(minutes=minutos)
        extremos.append(
            {
                "hora": hora.strftime("%Y-%m-%dT%H:%M"),
                "nivel": round(nivel, 2),
                "tipo": "alta" if alta else "baixa",
            }
        )
    return extremos


def buscar_regiao(sessao: requests.Session, marine_url: str, meteo_url: str, timezone: str) -> dict[str, Any]:
    regiao: dict[str, Any] = {}
    try:
        r = sessao.get(
            marine_url,
            params={
                "latitude": PONTO_MARE[0],
                "longitude": PONTO_MARE[1],
                "hourly": "sea_level_height_msl",
                "timezone": timezone,
                "past_days": 1,
                "forecast_days": 3,
            },
            timeout=20,
        )
        r.raise_for_status()
        h = r.json().get("hourly") or {}
        horas, niveis = h.get("time") or [], h.get("sea_level_height_msl") or []
        if horas and any(n is not None for n in niveis):
            regiao["mare"] = {
                "serie": [{"hora": t, "nivel": n} for t, n in zip(horas, niveis, strict=False)],
                "extremos": extremos_mare(horas, niveis),
            }
    except (requests.RequestException, ValueError) as e:
        log.warning("Falha ao consultar a maré: %s", e)

    try:
        r = sessao.get(
            meteo_url,
            params={
                "latitude": PONTO_SOL[0],
                "longitude": PONTO_SOL[1],
                "daily": "sunrise,sunset,daylight_duration",
                "timezone": timezone,
                "forecast_days": 3,
            },
            timeout=20,
        )
        r.raise_for_status()
        d = r.json().get("daily") or {}
        dias = d.get("time") or []
        duracoes = d.get("daylight_duration") or [None] * len(dias)
        regiao["sol"] = [
            {"data": dia, "nascer": nascer, "por": por, "duracao_s": duracao}
            for dia, nascer, por, duracao in zip(
                dias, d.get("sunrise") or [], d.get("sunset") or [], duracoes, strict=False
            )
            if nascer and por
        ]
    except (requests.RequestException, ValueError) as e:
        log.warning("Falha ao consultar nascer/pôr do sol: %s", e)
    return regiao
