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


def test_boletim_do_rio_tem_codigo_em_outra_coluna():
    boletim = inea.ler_boletim(Path(__file__).parent / "fixtures" / "boletim_inea_rio.pdf")
    assert len(boletim.status) == 39
    assert boletim.data.isoformat() == "2026-11-11"
    # BG00 no boletim vira BG000, como no histórico
    assert boletim.status["BG000"] is False
    assert boletim.status["CP004"] is True
    assert boletim.status["BD011"] is True
    # "Não Realizada" não é própria nem imprópria
    assert boletim.status["JT000"] is None


def test_pagina_com_varios_boletins_escolhe_pelo_nome():
    html = (
        '<a href="/u/Zona-sudoeste-e-Zona-sul-11-11-26.pdf">Último Boletim Divulgado</a>'
        '<a href="/u/Sepetiba-28-11-24.pdf">Último Boletim Divulgado</a>'
        '<a href="/u/Paqueta-09-11-26.pdf">Último Boletim Divulgado</a>'
    )
    url = "https://www.inea.rj.gov.br/rio-de-janeiro/"
    assert inea.encontrar_link_boletim(html, url, "paqueta").endswith("Paqueta-09-11-26.pdf")
    assert inea.encontrar_link_boletim(html, url, "zona-sudoeste|zona-sul").endswith("Zona-sul-11-11-26.pdf")


def test_normalizar_codigo():
    assert inea.normalizar_codigo("BG00") == "BG000"
    assert inea.normalizar_codigo("BD011") == "BD011"
    assert inea.normalizar_codigo("CP100") == "CP100"


def test_falha_no_download_fica_registrada(tmp_path):
    from unittest.mock import MagicMock

    import requests

    from praiometro.coleta import situacao

    sessao = MagicMock()
    sessao.get.side_effect = requests.ConnectTimeout("sem resposta")
    assert not inea.baixar_boletim(
        sessao, "https://inea/niteroi/", tmp_path / "b.pdf", fonte="boletim-niteroi"
    )
    assert situacao.fontes()["boletim-niteroi"] == "erro: ConnectTimeout: sem resposta"
