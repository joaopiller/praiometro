"""Orquestra a coleta horária e grava o estado consolidado."""

import logging
from datetime import datetime
from typing import Any
from zoneinfo import ZoneInfo

import requests

from ..catalogo import carregar_catalogo
from ..config import Settings
from ..storage import atualizar_json
from . import historico, inea, open_meteo, regiao
from .http import criar_sessao

log = logging.getLogger(__name__)


def chave_hora_atual(timezone: str, agora: datetime | None = None) -> str:
    agora = agora or datetime.now(ZoneInfo(timezone))
    return agora.replace(minute=0, second=0, microsecond=0).strftime("%Y-%m-%dT%H:%M")


def mesclar_estado(
    catalogo: dict[str, dict],
    estado_atual: dict[str, dict],
    leituras: dict[str, dict | None],
    previsoes: dict[str, list],
    balneabilidade: dict[str, bool | None],
    data_boletim: str | None = None,
) -> dict[str, dict]:
    """Combina catálogo, estado anterior e dados novos.

    Se a leitura de um ponto falhar, mantém a anterior; se o ponto não vier no
    boletim, mantém a balneabilidade anterior. As médias de avaliação são preservadas.
    """
    novo: dict[str, dict] = {}
    for codigo, info in catalogo.items():
        anterior = estado_atual.get(codigo, {})
        ponto: dict[str, Any] = {**info}
        for chave in ("avaliacao_media", "total_avaliacoes"):
            if chave in anterior:
                ponto[chave] = anterior[chave]

        leitura_anterior = anterior.get("leitura_atual") or {}
        leitura = leituras.get(codigo)
        if leitura is None:
            ponto["leitura_atual"] = leitura_anterior
            ponto["previsao"] = anterior.get("previsao", [])
        else:
            bal = balneabilidade.get(info.get("codigo_inea", codigo))
            if bal is None:
                bal = leitura_anterior.get("balneabilidade")
                data_bal = leitura_anterior.get("balneabilidade_data")
            else:
                data_bal = data_boletim
            ponto["leitura_atual"] = {**leitura, "balneabilidade": bal, "balneabilidade_data": data_bal}
            ponto["previsao"] = previsoes.get(codigo, [])
        novo[codigo] = ponto
    return novo


def executar_coleta(settings: Settings, sessao: requests.Session | None = None) -> dict[str, dict]:
    sessao = sessao or criar_sessao()
    catalogo = carregar_catalogo(settings.catalogo_file)
    codigos = list(catalogo)
    coordenadas = [catalogo[c]["coordenadas_decimais"] for c in codigos]
    chave = chave_hora_atual(settings.timezone)

    def buscar(url: str, variaveis) -> list[dict]:
        try:
            return open_meteo.buscar_lote(sessao, url, coordenadas, variaveis, settings.timezone)
        except (requests.RequestException, ValueError) as e:
            log.error("Falha ao consultar %s: %s", url, e)
            return [{} for _ in codigos]

    meteo = buscar(settings.open_meteo_url, open_meteo.METEO_VARIAVEIS)
    marine = buscar(settings.open_meteo_marine_url, open_meteo.MARINE_VARIAVEIS)
    # o modelo de ondas (~5 km) não enxerga a baía: lá ele repete a ondulação do mar aberto
    marine = [
        {k: v for k, v in m.items() if k not in ("wave_height", "wave_period")}
        if catalogo[c].get("mar") == "baia"
        else m
        for c, m in zip(codigos, marine, strict=True)
    ]

    leituras, previsoes = {}, {}
    for i, codigo in enumerate(codigos):
        leituras[codigo] = open_meteo.extrair_leitura(meteo[i], marine[i], chave)
        previsoes[codigo] = open_meteo.extrair_previsao(meteo[i], marine[i], chave, settings.horas_previsao)
        if leituras[codigo] is None:
            log.warning("Sem leitura para %s às %s; mantendo a anterior", codigo, chave)

    inea.baixar_boletim(sessao, settings.inea_url, settings.pdf_file)
    boletim = inea.ler_boletim(settings.pdf_file)
    data_boletim = boletim.data.isoformat() if boletim.data else None

    estado = atualizar_json(
        settings.estado_file,
        lambda atual: mesclar_estado(catalogo, atual, leituras, previsoes, boletim.status, data_boletim),
    )
    ok = sum(1 for v in leituras.values() if v)
    log.info("Coleta de %s concluída: %d/%d pontos atualizados", chave, ok, len(codigos))
    return estado


def atualizar_regiao(settings: Settings, sessao: requests.Session | None = None) -> dict:
    sessao = sessao or criar_sessao()
    dados = regiao.buscar_regiao(
        sessao, settings.open_meteo_marine_url, settings.open_meteo_url, settings.timezone
    )
    if not dados:
        return {}
    # mantém o que já existia se uma das consultas falhar
    return atualizar_json(settings.regiao_file, lambda atual: {**atual, **dados})


def atualizar_historico(settings: Settings, sessao: requests.Session | None = None) -> int:
    sessao = sessao or criar_sessao()
    ano = datetime.now(ZoneInfo(settings.timezone)).year
    anos = [ano] if settings.historico_file.exists() else [ano - 1, ano]
    novo: dict[str, dict[str, bool]] = {}
    for a in anos:
        pdf = settings.pdf_file.with_name(f"historico_{a}.pdf")
        historico.baixar_historico(sessao, settings.inea_url, a, pdf)
        if pdf.exists():
            try:
                historico.mesclar_historico(novo, historico.ler_historico(pdf))
            except Exception:
                log.exception("Erro ao ler o histórico de %d", a)
    if not novo:
        return 0
    atualizar_json(settings.historico_file, lambda atual: historico.mesclar_historico(atual, novo))
    total = sum(len(v) for v in novo.values())
    log.info("Histórico atualizado: %d registros", total)
    return total
