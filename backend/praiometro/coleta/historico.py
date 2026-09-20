"""Histórico de balneabilidade a partir dos PDFs anuais do INEA."""

import logging
import re
import unicodedata
from datetime import date
from pathlib import Path

import pdfplumber
import requests
from bs4 import BeautifulSoup

from .inea import CODIGO_PONTO, MESES, interpretar_status

log = logging.getLogger(__name__)


def _normalizar(texto: str) -> str:
    return unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode().lower()


def link_do_ano(html: str, ano: int) -> str | None:
    soup = BeautifulSoup(html, "html.parser")
    for a in soup.find_all("a", href=True):
        if a.get_text(strip=True) == str(ano) and "historico" in a["href"].lower():
            return a["href"]
    return None


def _datas_da_pagina(texto: str) -> list[date]:
    """Cabeçalho: "... janeiro-24 fevereiro-24 ..." seguido da linha com os dias de coleta."""
    linhas = texto.split("\n")
    for i, linha in enumerate(linhas):
        meses = re.findall(r"([a-z]+)-(\d{2})\b", _normalizar(linha))
        meses = [(MESES[m], 2000 + int(a)) for m, a in meses if m in MESES]
        if not meses:
            continue
        dias = next((lin for lin in linhas[i + 1 :] if re.fullmatch(r"[\d ]+", lin.strip())), None)
        if not dias:
            return []
        datas, indice, anterior = [], 0, 0
        for dia in map(int, dias.split()):
            if dia < anterior:
                indice += 1
            if indice >= len(meses):
                break
            mes, ano = meses[indice]
            try:
                datas.append(date(ano, mes, dia))
            except ValueError:
                return []
            anterior = dia
        return datas
    return []


def ler_historico(caminho_pdf: Path) -> dict[str, dict[str, bool]]:
    """{codigo: {"AAAA-MM-DD": própria?}}"""
    resultado: dict[str, dict[str, bool]] = {}
    with pdfplumber.open(caminho_pdf) as pdf:
        for pagina in pdf.pages:
            datas = _datas_da_pagina(pagina.extract_text() or "")
            if not datas:
                continue
            for tabela in pagina.extract_tables():
                for linha in tabela:
                    if not linha or len(linha) < 4:
                        continue
                    codigo = (linha[1] or "").strip()
                    if not CODIGO_PONTO.match(codigo):
                        continue
                    for data, valor in zip(datas, linha[3 : 3 + len(datas)], strict=False):
                        status = interpretar_status(valor)
                        if status is not None:
                            resultado.setdefault(codigo, {})[data.isoformat()] = status
    return resultado


def baixar_historico(sessao: requests.Session, url_pagina: str, ano: int, destino: Path) -> bool:
    try:
        pagina = sessao.get(url_pagina, timeout=20)
        pagina.raise_for_status()
        url = link_do_ano(pagina.text, ano)
        if not url:
            log.info("Histórico de %d ainda não publicado", ano)
            return False
        pdf = sessao.get(url, timeout=30)
        pdf.raise_for_status()
        if not pdf.content.startswith(b"%PDF"):
            return False
        destino.parent.mkdir(parents=True, exist_ok=True)
        destino.write_bytes(pdf.content)
        return True
    except requests.RequestException as e:
        log.warning("Falha ao baixar histórico de %d: %s", ano, e)
        return False


def mesclar_historico(atual: dict, novo: dict[str, dict[str, bool]]) -> dict:
    for codigo, registros in novo.items():
        atual.setdefault(codigo, {}).update(registros)
    return atual
