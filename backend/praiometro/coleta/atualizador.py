"""Orquestra a coleta horária e grava o estado consolidado."""

import logging
from dataclasses import dataclass
from datetime import datetime
from pathlib import Path
from typing import Any
from zoneinfo import ZoneInfo

import requests

from ..catalogo import carregar_catalogo
from ..config import Settings
from ..storage import atualizar_json
from . import historico, inea, open_meteo, regiao
from .http import criar_sessao

log = logging.getLogger(__name__)


@dataclass(frozen=True)
class FonteBoletim:
    """Onde fica o boletim de uma cidade no site do INEA."""

    cidade: str
    pagina: str
    # trecho do nome do PDF, quando a página tem boletins de várias regiões
    boletim: str | None = None
    historico: str | None = None


def fontes(settings: Settings) -> list[FonteBoletim]:
    return [
        FonteBoletim("niteroi", settings.inea_url),
        FonteBoletim(
            "rio", settings.inea_rio_url, boletim="zona-sudoeste|zona-sul", historico="barra_e_zona_sul"
        ),
    ]


def _pdf(settings: Settings, fonte: FonteBoletim, nome: str = "boletim") -> Path:
    # Niterói continua no arquivo de antes
    sufixo = "" if fonte.cidade == "niteroi" else f"_{fonte.cidade}"
    if nome == "boletim":
        return settings.pdf_file.with_name(f"{settings.pdf_file.stem}{sufixo}.pdf")
    return settings.pdf_file.with_name(f"{nome}{sufixo}.pdf")


def chave_hora_atual(timezone: str, agora: datetime | None = None) -> str:
    agora = agora or datetime.now(ZoneInfo(timezone))
    return agora.replace(minute=0, second=0, microsecond=0).strftime("%Y-%m-%dT%H:%M")


def mesclar_estado(
    catalogo: dict[str, dict],
    estado_atual: dict[str, dict],
    leituras: dict[str, dict | None],
    previsoes: dict[str, list],
    balneabilidade: dict[str, bool | None],
    data_boletim: str | dict[str, str | None] | None = None,
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
                # cada cidade tem o seu boletim, com a sua data
                data_bal = (
                    data_boletim.get(info.get("cidade", "niteroi"))
                    if isinstance(data_boletim, dict)
                    else data_boletim
                )
            ponto["leitura_atual"] = {**leitura, "balneabilidade": bal, "balneabilidade_data": data_bal}
            ponto["previsao"] = previsoes.get(codigo, [])
        novo[codigo] = ponto
    return novo


def executar_coleta(settings: Settings, sessao: requests.Session | None = None) -> dict[str, dict]:
    sessao = sessao or criar_sessao()
    catalogo = carregar_catalogo(settings.catalogo_file)
    codigos = list(catalogo)
    # clima no ponto em terra (onde fica o banhista); mar no ponto de coleta, dentro da água
    em_terra = [
        catalogo[c].get("coordenadas_terra_decimais") or catalogo[c]["coordenadas_decimais"] for c in codigos
    ]
    na_agua = [catalogo[c]["coordenadas_decimais"] for c in codigos]
    chave = chave_hora_atual(settings.timezone)

    def buscar(url: str, variaveis, coordenadas) -> list[dict]:
        try:
            return open_meteo.buscar_lote(sessao, url, coordenadas, variaveis, settings.timezone)
        except (requests.RequestException, ValueError) as e:
            log.error("Falha ao consultar %s: %s", url, e)
            return [{} for _ in codigos]

    meteo = buscar(settings.open_meteo_url, open_meteo.METEO_VARIAVEIS, em_terra)
    marine = buscar(settings.open_meteo_marine_url, open_meteo.MARINE_VARIAVEIS, na_agua)
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

    status: dict[str, bool | None] = {}
    datas: dict[str, str | None] = {}
    for fonte in fontes(settings):
        pdf = _pdf(settings, fonte)
        inea.baixar_boletim(sessao, fonte.pagina, pdf, arquivo=fonte.boletim)
        boletim = inea.ler_boletim(pdf)
        status.update(boletim.status)
        datas[fonte.cidade] = boletim.data.isoformat() if boletim.data else None

    estado = atualizar_json(
        settings.estado_file,
        lambda atual: mesclar_estado(catalogo, atual, leituras, previsoes, status, datas),
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
    novo: dict[str, dict[str, bool]] = {}
    for fonte in fontes(settings):
        for a in (ano - 1, ano):
            pdf = _pdf(settings, fonte, f"historico_{a}")
            # o ano passado não muda mais: baixa só uma vez
            if a == ano or not pdf.exists():
                historico.baixar_historico(sessao, fonte.pagina, a, pdf, arquivo=fonte.historico)
            if pdf.exists():
                try:
                    historico.mesclar_historico(novo, historico.ler_historico(pdf))
                except Exception:
                    log.exception("Erro ao ler o histórico de %d (%s)", a, fonte.cidade)
    if not novo:
        return 0
    atualizar_json(settings.historico_file, lambda atual: historico.mesclar_historico(atual, novo))
    total = sum(len(v) for v in novo.values())
    log.info("Histórico atualizado: %d registros", total)
    return total
