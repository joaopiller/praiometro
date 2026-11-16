"""Boletim de balneabilidade do INEA (PDF publicado no site)."""

import logging
import re
import unicodedata
from dataclasses import dataclass, field
from datetime import date
from pathlib import Path
from urllib.parse import urljoin

import pdfplumber
import requests
from bs4 import BeautifulSoup

log = logging.getLogger(__name__)

# Códigos de ponto do INEA: duas letras + dígitos. Niterói usa três (IC003); o boletim
# do Rio às vezes usa dois (BG00) e o histórico, três (BG000).
CODIGO_PONTO = re.compile(r"^[A-Z]{2}\d{2,3}$")


def normalizar_codigo(codigo: str) -> str:
    """BG00 → BG000; códigos de três dígitos ficam como estão."""
    return codigo[:2] + codigo[2:].zfill(3)


MESES = {
    m: i
    for i, m in enumerate(
        (
            "janeiro",
            "fevereiro",
            "marco",
            "abril",
            "maio",
            "junho",
            "julho",
            "agosto",
            "setembro",
            "outubro",
            "novembro",
            "dezembro",
        ),
        start=1,
    )
}


@dataclass
class Boletim:
    data: date | None = None
    status: dict[str, bool | None] = field(default_factory=dict)


def _normalizar(texto: str) -> str:
    sem_acento = unicodedata.normalize("NFKD", texto).encode("ascii", "ignore").decode()
    return " ".join(sem_acento.lower().split())


def interpretar_status(texto: str | None) -> bool | None:
    """'Própria' → True, 'Imprópria' → False, qualquer outra coisa → None."""
    if not texto:
        return None
    t = _normalizar(texto)
    if t.startswith("impropria"):
        return False
    if t.startswith("propria"):
        return True
    return None


def data_do_texto(texto: str) -> date | None:
    """ "... Nº62 - 22 de SETEMBRO de 2025" → date(2025, 9, 22)"""
    m = re.search(r"(\d{1,2}) de ([a-z]+) de (\d{4})", _normalizar(texto))
    if not m or m[2] not in MESES:
        return None
    try:
        return date(int(m[3]), MESES[m[2]], int(m[1]))
    except ValueError:
        return None


def data_do_nome(nome: str) -> date | None:
    """ "Niteroi-12-11-26.pdf" → date(2026, 11, 12)"""
    m = re.search(r"(\d{2})-(\d{2})-(\d{2}|\d{4})(?:\D|$)", nome)
    if not m:
        return None
    ano = int(m[3]) + (2000 if len(m[3]) == 2 else 0)
    try:
        return date(ano, int(m[2]), int(m[1]))
    except ValueError:
        return None


def encontrar_link_boletim(html: str, url_base: str, arquivo: str | None = None) -> str | None:
    """Link do "Último Boletim Divulgado". Páginas com vários boletins (a do Rio tem um por
    região) pedem `arquivo`, um trecho do nome do PDF."""
    soup = BeautifulSoup(html, "html.parser")
    for link in soup.find_all("a", href=True):
        if arquivo and not re.search(arquivo, _normalizar(link["href"])):
            continue
        if "ultimo boletim" in _normalizar(link.get_text(" ")):
            # o link do site costuma ser relativo
            return urljoin(url_base, link["href"])
    return None


def baixar_boletim(
    sessao: requests.Session, url_pagina: str, destino: Path, timeout: float = 20, arquivo: str | None = None
) -> bool:
    """Baixa o boletim mais recente; se falhar, mantém o arquivo anterior."""
    try:
        pagina = sessao.get(url_pagina, timeout=timeout)
        pagina.raise_for_status()
        url_pdf = encontrar_link_boletim(pagina.text, url_pagina, arquivo)
        if not url_pdf:
            log.warning("Link do último boletim não encontrado em %s", url_pagina)
            return False
        pdf = sessao.get(url_pdf, timeout=timeout)
        pdf.raise_for_status()
        if not pdf.content.startswith(b"%PDF"):
            log.warning("Conteúdo baixado de %s não é um PDF", url_pdf)
            return False
        destino.parent.mkdir(parents=True, exist_ok=True)
        tmp = destino.with_suffix(".tmp")
        tmp.write_bytes(pdf.content)
        tmp.replace(destino)
        destino.with_suffix(".url").write_text(url_pdf, encoding="utf-8")
        log.info("Boletim do INEA atualizado: %s", url_pdf)
        return True
    except requests.RequestException as e:
        log.warning("Falha ao baixar boletim do INEA: %s", e)
        return False


def ler_boletim(caminho_pdf: Path) -> Boletim:
    """Status mais recente de cada ponto e a data do boletim."""
    boletim = Boletim()
    try:
        with pdfplumber.open(caminho_pdf) as pdf:
            for n, pagina in enumerate(pdf.pages):
                if n == 0:
                    boletim.data = data_do_texto(pagina.extract_text() or "")
                for tabela in pagina.extract_tables():
                    for linha in tabela:
                        if not linha or len(linha) < 4:
                            continue
                        # Niterói: praia, código, local; Rio: praia, local, código
                        celulas = [(c or "").strip() for c in linha]
                        indice = next((i for i in (1, 2) if CODIGO_PONTO.match(celulas[i])), None)
                        medicoes = [m for m in celulas[(indice or 0) + 1 :] if m]
                        if indice is not None and medicoes:
                            codigo = normalizar_codigo(celulas[indice])
                            boletim.status[codigo] = interpretar_status(medicoes[-1])
    except FileNotFoundError:
        log.warning("Boletim %s não encontrado", caminho_pdf)
        return boletim
    except Exception:
        log.exception("Erro ao processar o boletim %s", caminho_pdf)

    if boletim.data is None:
        url = caminho_pdf.with_suffix(".url")
        if url.exists():
            boletim.data = data_do_nome(url.read_text(encoding="utf-8"))
    return boletim


def extrair_balneabilidade(caminho_pdf: Path) -> dict[str, bool | None]:
    return ler_boletim(caminho_pdf).status
