import threading

import pytest

from praiometro import storage


def test_salvar_e_ler(tmp_path):
    caminho = tmp_path / "sub" / "x.json"
    storage.salvar_json_atomico({"a": "ç"}, caminho)
    assert storage.ler_json(caminho) == {"a": "ç"}
    assert list(caminho.parent.iterdir()) == [caminho]  # sem temporários sobrando


def test_atualizar_json_concorrente_nao_perde_escritas(tmp_path):
    caminho = tmp_path / "contador.json"
    storage.salvar_json_atomico({"n": 0}, caminho)

    def incrementar():
        for _ in range(20):
            storage.atualizar_json(caminho, lambda d: {"n": d["n"] + 1})

    threads = [threading.Thread(target=incrementar) for _ in range(5)]
    for t in threads:
        t.start()
    for t in threads:
        t.join()
    assert storage.ler_json(caminho) == {"n": 100}


def test_trava_timeout(tmp_path):
    caminho = tmp_path / "x.json"
    with storage.trava(caminho), pytest.raises(TimeoutError), storage.trava(caminho, timeout=0.3):
        pass


def test_trava_abandonada_e_removida(tmp_path, monkeypatch):
    caminho = tmp_path / "x.json"
    lock = tmp_path / "x.json.lock"
    lock.write_text("123")
    monkeypatch.setattr(storage, "LOCK_ABANDONADO_APOS", -1)
    with storage.trava(caminho, timeout=1):
        assert lock.exists()
    assert not lock.exists()


def test_arquivos_gerados_ficam_no_data_dir(tmp_path):
    from praiometro.config import Settings

    s = Settings(_env_file=None, data_dir=tmp_path)
    for arquivo in (s.estado_file, s.pdf_file, s.historico_file, s.regiao_file):
        assert arquivo.parent == tmp_path
    assert s.catalogo_file.exists()
