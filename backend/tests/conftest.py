import json
import shutil
from pathlib import Path

import mongomock
import pytest
from fastapi.testclient import TestClient

from praiometro.api.app import create_app
from praiometro.auth import TokenInvalidoError
from praiometro.avaliacoes import RepositorioVotos
from praiometro.config import PACKAGE_DIR, Settings

FIXTURES = Path(__file__).parent / "fixtures"
CATALOGO = PACKAGE_DIR / "dados" / "praias.json"

LEITURA = {
    "timestamp": "2026-01-10T14:00",
    "temperature_2m": 29.1,
    "apparent_temperature": 32.0,
    "relative_humidity_2m": 70,
    "uv_index": 9.5,
    "weather_code": 1,
    "wave_height": 0.8,
    "wave_period": 6.2,
    "wind_speed_10m": 12.0,
    "choveu_8_horas": False,
    "balneabilidade": True,
}


@pytest.fixture
def settings(tmp_path) -> Settings:
    catalogo = tmp_path / "praias.json"
    shutil.copy(CATALOGO, catalogo)
    return Settings(
        _env_file=None,
        catalogo_file=catalogo,
        estado_file=tmp_path / "var" / "pontos.json",
        pdf_file=tmp_path / "var" / "boletim.pdf",
        historico_file=tmp_path / "var" / "historico.json",
        regiao_file=tmp_path / "var" / "regiao.json",
        google_client_id="client-id-de-teste",
    )


@pytest.fixture
def estado(settings) -> dict:
    catalogo = json.loads(settings.catalogo_file.read_text(encoding="utf-8"))
    dados = {codigo: {**info, "leitura_atual": dict(LEITURA)} for codigo, info in catalogo.items()}
    settings.estado_file.parent.mkdir(parents=True, exist_ok=True)
    settings.estado_file.write_text(json.dumps(dados), encoding="utf-8")
    return dados


@pytest.fixture
def colecao():
    return mongomock.MongoClient().db.votos


@pytest.fixture
def repo(colecao) -> RepositorioVotos:
    return RepositorioVotos(colecao)


def verificador_falso(token: str) -> str:
    if token.startswith("valido-"):
        return token.removeprefix("valido-")
    raise TokenInvalidoError("token falso")


@pytest.fixture
def client(settings, estado, repo):
    app = create_app(settings, repo=repo, verificador=verificador_falso)
    with TestClient(app) as c:
        yield c
