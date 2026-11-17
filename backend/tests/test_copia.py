import json
import os
from unittest.mock import patch

import mongomock
import pytest
from fastapi.testclient import TestClient

from praiometro.api.app import create_app
from praiometro.copia import CopiaDosArquivos
from praiometro.worker import rodar

from .conftest import verificador_falso


@pytest.fixture
def banco():
    return mongomock.MongoClient().db


def test_arquivo_guardado_volta_igual_e_com_a_mesma_data(tmp_path, banco):
    arquivo = tmp_path / "var" / "historico.json"
    arquivo.parent.mkdir()
    arquivo.write_text(json.dumps({"GR000": {"2026-01-05": True}}), encoding="utf-8")
    os.utime(arquivo, (1_700_000_000, 1_700_000_000))
    assert CopiaDosArquivos(banco.arquivos, [arquivo]).guardar() == ["historico.json"]

    arquivo.unlink()
    assert CopiaDosArquivos(banco.arquivos, [arquivo]).restaurar() == ["historico.json"]
    assert json.loads(arquivo.read_text(encoding="utf-8")) == {"GR000": {"2026-01-05": True}}
    assert arquivo.stat().st_mtime == 1_700_000_000


def test_so_guarda_de_novo_o_que_mudou(tmp_path, banco):
    arquivo = tmp_path / "pontos.json"
    arquivo.write_text("{}", encoding="utf-8")
    copia = CopiaDosArquivos(banco.arquivos, [arquivo, tmp_path / "nao-existe.json"])
    assert copia.guardar() == ["pontos.json"]
    assert copia.guardar() == []
    arquivo.write_text('{"a": 1}', encoding="utf-8")
    os.utime(arquivo, (arquivo.stat().st_atime, arquivo.stat().st_mtime + 5))
    assert copia.guardar() == ["pontos.json"]


def test_restaurar_nao_passa_por_cima_do_que_esta_no_disco(tmp_path, banco):
    arquivo = tmp_path / "pontos.json"
    arquivo.write_text('{"antigo": 1}', encoding="utf-8")
    CopiaDosArquivos(banco.arquivos, [arquivo]).guardar()
    arquivo.write_text('{"novo": 1}', encoding="utf-8")
    assert CopiaDosArquivos(banco.arquivos, [arquivo]).restaurar() == []
    assert json.loads(arquivo.read_text(encoding="utf-8")) == {"novo": 1}


def test_api_com_coleta_embutida_sobe_com_os_dados_guardados(settings, estado, repo):
    settings.coletor_embutido = True
    settings.historico_file.write_text(json.dumps({"GR000": {"2026-01-05": True}}), encoding="utf-8")
    arquivos = [settings.estado_file, settings.historico_file]
    CopiaDosArquivos(repo.colecao.database.arquivos, arquivos).guardar()
    for arquivo in arquivos:
        arquivo.unlink()

    with patch("praiometro.api.app.rodar_coletor"):
        app = create_app(settings, repo=repo, verificador=verificador_falso)
        with TestClient(app) as c:
            assert c.get("/health").json()["pontos_com_leitura"] == 68
            assert c.get("/pontos/GR000/historico").json()["total"] == 1


def test_coleta_embutida_guarda_o_que_gera(settings, estado, repo):
    settings.coletor_embutido = True
    with (
        patch("praiometro.worker.criar_colecao_votos", return_value=repo.colecao),
        patch("praiometro.worker.executar_coleta"),
        patch("praiometro.worker.atualizar_regiao"),
        patch("praiometro.worker.atualizar_historico"),
    ):
        rodar(settings, uma_vez=True)
    assert repo.colecao.database.arquivos.find_one({"_id": settings.estado_file.name})


def test_worker_separado_nao_guarda_no_banco(settings, estado, repo):
    with (
        patch("praiometro.worker.criar_colecao_votos", return_value=repo.colecao),
        patch("praiometro.worker.executar_coleta"),
        patch("praiometro.worker.atualizar_regiao"),
        patch("praiometro.worker.atualizar_historico"),
    ):
        rodar(settings, uma_vez=True)
    assert repo.colecao.database.arquivos.count_documents({}) == 0


def _rodar_uma_vez(settings, repo):
    with (
        patch("praiometro.worker.criar_colecao_votos", return_value=repo.colecao),
        patch("praiometro.worker.executar_coleta"),
        patch("praiometro.worker.atualizar_regiao"),
        patch("praiometro.worker.atualizar_historico") as historico,
    ):
        rodar(settings, uma_vez=True)
    return historico


def test_historico_recente_nao_e_refeito_ao_iniciar(settings, estado, repo):
    settings.historico_file.write_text("{}", encoding="utf-8")
    _rodar_uma_vez(settings, repo).assert_not_called()


def test_historico_antigo_ou_ausente_e_refeito_ao_iniciar(settings, estado, repo):
    _rodar_uma_vez(settings, repo).assert_called_once()
    settings.historico_file.write_text("{}", encoding="utf-8")
    ha_sete_horas = settings.historico_file.stat().st_mtime - 7 * 3600
    os.utime(settings.historico_file, (ha_sete_horas, ha_sete_horas))
    _rodar_uma_vez(settings, repo).assert_called_once()
