from fastapi import Header, HTTPException, Query, Request

from ..auth import VerificadorTokens
from ..avaliacoes import RepositorioVotos
from ..config import Settings
from ..praias import agrupar, id_da_praia
from ..relatos import RepositorioRelatos
from .cache import CachePontos
from .ratelimit import LimitadorTaxa


# async: dependências síncronas iriam para o threadpool à toa
async def get_settings(request: Request) -> Settings:
    return request.app.state.settings


async def get_cache(request: Request) -> CachePontos:
    return request.app.state.cache


async def get_repo(request: Request) -> RepositorioVotos:
    return request.app.state.repo


async def get_verificador(request: Request) -> VerificadorTokens:
    return request.app.state.verificador


async def get_limitador(request: Request) -> LimitadorTaxa:
    return request.app.state.limitador


async def get_pontos(request: Request) -> dict[str, dict]:
    dados = request.app.state.cache.dados
    if not dados:
        raise HTTPException(status_code=503, detail="Dados temporariamente indisponíveis")
    return dados


def obter_ponto(pontos: dict[str, dict], codigo: str) -> dict:
    for chave in (codigo, codigo.upper()):
        if chave in pontos:
            return pontos[chave]
    raise HTTPException(status_code=404, detail="Praia não encontrada")


def obter_praia(pontos: dict[str, dict], id_ou_codigo: str) -> dict:
    """Id da praia (IC, copacabana) ou código de um ponto dela (IC003), como nas versões antigas."""
    praias = agrupar(pontos)
    for chave in (id_ou_codigo, id_ou_codigo.upper(), id_ou_codigo.lower()):
        if chave in praias:
            return praias[chave]
        if chave in pontos:
            return praias[id_da_praia(chave, pontos[chave])]
    raise HTTPException(status_code=404, detail="Praia não encontrada")


async def get_relatos(request: Request) -> RepositorioRelatos:
    return request.app.state.relatos


async def get_token(
    authorization: str | None = Header(None),
    token: str | None = Query(None, deprecated=True, description="Use o header Authorization: Bearer"),
) -> str:
    if authorization and authorization.lower().startswith("bearer "):
        return authorization[7:].strip()
    if token:  # versões antigas do app
        return token
    raise HTTPException(status_code=401, detail="Faça login para continuar")
