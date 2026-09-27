from pathlib import Path

import pytest

from praiometro.coleta import inea

FIXTURE = Path(__file__).parent / "fixtures" / "boletim_inea.pdf"


@pytest.mark.parametrize(
    ("texto", "esperado"),
    [
        ("Própria", True),
        ("  própria\n", True),
        ("Imprópria", False),
        ("IMPRÓPRIA", False),
        ("Impropria", False),
        ("-", None),
        ("", None),
        (None, None),
    ],
)
def test_interpretar_status(texto, esperado):
    assert inea.interpretar_status(texto) is esperado


def test_encontrar_link_relativo():
    html = '<a href="/x/boletim.pdf">Clique aqui para o <b>Último Boletim</b></a>'
    assert inea.encontrar_link_boletim(html, "https://www.inea.rj.gov.br/niteroi/") == (
        "https://www.inea.rj.gov.br/x/boletim.pdf"
    )


def test_link_nao_encontrado():
    assert inea.encontrar_link_boletim("<a href='a'>outra coisa</a>", "https://x") is None


def test_extrair_balneabilidade_do_pdf_real():
    resultado = inea.extrair_balneabilidade(FIXTURE)
    assert len(resultado) == 29
    assert "PONTO\nCOLETA" not in resultado  # cabeçalho da tabela é ignorado
    assert resultado["GR000"] is True
    assert resultado["IC002"] is False
    assert resultado["IC000"] is True


def test_pdf_inexistente(tmp_path):
    assert inea.extrair_balneabilidade(tmp_path / "nao_existe.pdf") == {}


def test_ler_boletim_traz_data_do_cabecalho():
    boletim = inea.ler_boletim(FIXTURE)
    assert boletim.data.isoformat() == "2025-09-22"
    assert boletim.status["GR000"] is True


@pytest.mark.parametrize(
    ("texto", "esperado"),
    [
        ("BOLETIM ... Nº62 - 22 de SETEMBRO de 2025", "2025-09-22"),
        ("boletim de 3 de março de 2026", "2026-03-03"),
        ("31 de fevereiro de 2026", None),
        ("sem data", None),
    ],
)
def test_data_do_texto(texto, esperado):
    data = inea.data_do_texto(texto)
    assert (data.isoformat() if data else None) == esperado


def test_data_do_nome_do_arquivo():
    url = "https://www.inea.rj.gov.br/wp-content/uploads/2026/11/Niteroi-12-11-26.pdf"
    assert inea.data_do_nome(url).isoformat() == "2026-11-12"
    assert inea.data_do_nome("boletim.pdf") is None


def test_data_pelo_nome_quando_o_pdf_nao_tem(tmp_path, monkeypatch):
    pdf = tmp_path / "boletim.pdf"
    pdf.write_bytes(b"x")
    pdf.with_suffix(".url").write_text("https://x/Niteroi-05-01-26.pdf")
    monkeypatch.setattr(inea.pdfplumber, "open", lambda _p: (_ for _ in ()).throw(ValueError("pdf ruim")))
    assert inea.ler_boletim(pdf).data.isoformat() == "2026-01-05"
