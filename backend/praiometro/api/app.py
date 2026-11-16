import logging
from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse

from .. import __version__
from ..auth import VerificadorTokens
from ..avaliacoes import RepositorioVotos
from ..config import Settings, configurar_logging, get_settings
from ..db import criar_colecao_votos
from ..relatos import RepositorioRelatos
from .cache import CacheJson, CachePontos
from .ratelimit import LimitadorTaxa
from .routes import avaliacoes, pontos, praias, regiao, sistema
from .routes import relatos as rotas_relatos

log = logging.getLogger(__name__)


def create_app(
    settings: Settings | None = None,
    repo: RepositorioVotos | None = None,
    verificador=None,
    relatos: RepositorioRelatos | None = None,
) -> FastAPI:
    settings = settings or get_settings()
    repo = repo or RepositorioVotos(criar_colecao_votos(settings))
    verificador = verificador or VerificadorTokens(settings.google_client_id, settings.apple_bundle_id)
    if relatos is None:
        banco = repo.colecao.database if isinstance(repo, RepositorioVotos) else None
        relatos = RepositorioRelatos(banco if banco is not None else criar_colecao_votos(settings).database)

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        app.state.cache.recarregar(forcar=True)
        for repositorio in (repo, relatos):
            try:
                repositorio.garantir_indices()
            except Exception as e:
                log.warning("Não foi possível criar índices no MongoDB: %s", e)
        yield

    app = FastAPI(
        title="Praiômetro API",
        description="Clima, mar, balneabilidade e avaliações das praias de Niterói e do Rio de Janeiro",
        version=__version__,
        lifespan=lifespan,
    )
    app.state.settings = settings
    app.state.repo = repo
    app.state.verificador = verificador
    app.state.relatos = relatos
    app.state.cache = CachePontos(settings.estado_file, settings.catalogo_file)
    app.state.cache_historico = CacheJson(settings.historico_file, intervalo=30)
    app.state.cache_regiao = CacheJson(settings.regiao_file, intervalo=30)
    app.state.cache_avaliacoes = {}
    app.state.ping_mongo = {"em": float("-inf"), "ok": False}
    app.state.limitador = LimitadorTaxa(settings.votos_por_minuto_por_ip)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=False,
        allow_methods=["GET", "POST"],
        allow_headers=["Authorization", "Content-Type"],
    )
    app.add_middleware(GZipMiddleware, minimum_size=1000)

    @app.exception_handler(RequestValidationError)
    async def erro_validacao(_request: Request, exc: RequestValidationError):
        return JSONResponse(
            status_code=422,
            content={
                "detail": "Dados inválidos: avalie todos os critérios com 0,5 a 5 estrelas."
                if _request.url.path.rstrip("/").endswith("/votar")
                else "Dados inválidos. Confira o que foi enviado e tente de novo.",
                "erros": jsonable(exc.errors()),
            },
        )

    @app.exception_handler(Exception)
    async def erro_inesperado(request: Request, exc: Exception):
        log.exception("Erro inesperado em %s %s", request.method, request.url.path)
        return JSONResponse(
            status_code=500,
            content={"detail": "Erro interno no servidor. Tente novamente em instantes."},
        )

    app.include_router(sistema.router)
    app.include_router(praias.router)
    app.include_router(pontos.router)
    app.include_router(avaliacoes.router)
    app.include_router(regiao.router)
    app.include_router(rotas_relatos.router)
    return app


def jsonable(erros):
    from fastapi.encoders import jsonable_encoder

    return jsonable_encoder(erros, exclude={"ctx", "url", "input"})


def main() -> None:
    import uvicorn

    settings = get_settings()
    configurar_logging(settings.log_level)
    uvicorn.run(
        "praiometro.api.app:create_app",
        factory=True,
        host="0.0.0.0",
        port=settings.port,
        workers=settings.api_workers,
        proxy_headers=True,
    )


if __name__ == "__main__":
    main()
