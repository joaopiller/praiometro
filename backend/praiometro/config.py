"""Configuração via variáveis de ambiente / .env."""

import logging
from functools import lru_cache
from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict

BACKEND_DIR = Path(__file__).resolve().parent.parent
PACKAGE_DIR = Path(__file__).resolve().parent


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=BACKEND_DIR / ".env", extra="ignore")

    mongo_uri: str = "mongodb://localhost:27017"
    mongo_db: str = "praiometro"

    catalogo_file: Path = PACKAGE_DIR / "dados" / "praias.json"
    # pasta onde o worker grava tudo o que gera; os arquivos abaixo podem ser sobrescritos um a um
    data_dir: Path = BACKEND_DIR / "var"
    estado_file: Path | None = None
    pdf_file: Path | None = None
    historico_file: Path | None = None
    regiao_file: Path | None = None

    port: int = 8000
    api_workers: int = 2
    log_level: str = "INFO"
    google_client_id: str | None = None
    # audiência dos tokens do "Entrar com a Apple" no app iOS
    apple_bundle_id: str | None = "com.praiometro.app"
    cors_origins: list[str] = ["*"]

    # Coleta
    inea_url: str = "https://www.inea.rj.gov.br/niteroi/"
    open_meteo_url: str = "https://api.open-meteo.com/v1/forecast"
    open_meteo_marine_url: str = "https://marine-api.open-meteo.com/v1/marine"
    timezone: str = "America/Sao_Paulo"
    horas_previsao: int = 24

    # Regras de negócio
    # 0 = o usuário pode atualizar a própria avaliação quando quiser (vale a mais recente)
    dias_entre_votos: int = 0
    votos_por_minuto_por_ip: int = 10

    def model_post_init(self, __context) -> None:
        # caminhos relativos partem de backend/
        if not self.data_dir.is_absolute():
            self.data_dir = BACKEND_DIR / self.data_dir
        padroes = {
            "estado_file": "pontos.json",
            "pdf_file": "boletim_inea.pdf",
            "historico_file": "historico.json",
            "regiao_file": "regiao.json",
        }
        for campo, nome in padroes.items():
            valor: Path | None = getattr(self, campo)
            if valor is None:
                setattr(self, campo, self.data_dir / nome)
            elif not valor.is_absolute():
                setattr(self, campo, BACKEND_DIR / valor)
        if not self.catalogo_file.is_absolute():
            self.catalogo_file = BACKEND_DIR / self.catalogo_file


@lru_cache
def get_settings() -> Settings:
    return Settings()


def configurar_logging(nivel: str = "INFO") -> None:
    logging.basicConfig(
        level=nivel.upper(),
        format="%(asctime)s %(levelname)-7s %(name)s: %(message)s",
    )
