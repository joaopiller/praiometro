import logging
import time
from datetime import timedelta

from fastapi import APIRouter, Depends, Header, HTTPException, Query, Request
from pymongo.errors import PyMongoError

from ...auth import TokenInvalidoError, VerificadorGoogle
from ...avaliacoes import RepositorioVotos
from ...config import Settings
from ..deps import get_limitador, get_pontos, get_repo, get_settings, get_verificador, obter_ponto
from ..ratelimit import LimitadorTaxa
from ..schemas import Avaliacao, RespostaVoto, VotoIn

log = logging.getLogger(__name__)
router = APIRouter(tags=["avaliações"])

_TTL = 60.0


def _cache_avaliacoes(request: Request) -> dict:
    return request.app.state.cache_avaliacoes


@router.get("/pontos/{codigo}/avaliacao", response_model=Avaliacao, summary="Médias de avaliação da praia")
def obter_avaliacao(
    codigo: str,
    request: Request,
    pontos: dict = Depends(get_pontos),
    repo: RepositorioVotos = Depends(get_repo),
):
    ponto = obter_ponto(pontos, codigo)
    cache = _cache_avaliacoes(request)
    em_cache = cache.get(codigo)
    if em_cache and time.monotonic() - em_cache[0] < _TTL:
        return em_cache[1]

    try:
        resumo = repo.resumo(codigo)
    except PyMongoError as e:
        # Mongo fora: usa o snapshot gravado pelo worker
        log.warning("Falha ao calcular avaliação de %s: %s", codigo, e)
        return Avaliacao(
            praia_id=codigo,
            avaliacao_media=ponto.get("avaliacao_media"),
            total_avaliacoes=ponto.get("total_avaliacoes"),
        )

    if resumo is None:
        resposta = Avaliacao(praia_id=codigo, avaliacao_media=None, total_avaliacoes=0)
    else:
        resposta = Avaliacao(
            praia_id=codigo,
            avaliacao_media=resumo.estrelas,
            medias_exatas=resumo.medias,
            nota_geral=resumo.nota_geral,
            total_avaliacoes=resumo.total,
        )
    cache[codigo] = (time.monotonic(), resposta)
    return resposta


def _extrair_token(authorization: str | None, token_query: str | None) -> str:
    if authorization and authorization.lower().startswith("bearer "):
        return authorization[7:].strip()
    if token_query:  # versões antigas do app
        return token_query
    raise HTTPException(status_code=401, detail="Faça login para avaliar")


# def síncrono: pymongo e google-auth bloqueiam, então rodam no threadpool
@router.post("/votar", response_model=RespostaVoto, summary="Registra a avaliação do usuário")
def votar(
    votos: VotoIn,
    request: Request,
    praia_id: str = Query(..., description="Código da praia"),
    authorization: str | None = Header(None),
    token: str | None = Query(None, deprecated=True, description="Use o header Authorization: Bearer"),
    pontos: dict = Depends(get_pontos),
    repo: RepositorioVotos = Depends(get_repo),
    verificador: VerificadorGoogle = Depends(get_verificador),
    limitador: LimitadorTaxa = Depends(get_limitador),
    settings: Settings = Depends(get_settings),
):
    ip = request.client.host if request.client else "?"
    if not limitador.permitir(ip):
        raise HTTPException(status_code=429, detail="Muitas tentativas. Aguarde um minuto.")

    obter_ponto(pontos, praia_id)
    try:
        user_id = verificador(_extrair_token(authorization, token))
    except TokenInvalidoError:
        raise HTTPException(status_code=401, detail="Login expirado ou inválido. Entre novamente.") from None

    try:
        resultado = repo.registrar(
            praia_id, user_id, votos.model_dump(), timedelta(days=settings.dias_entre_votos)
        )
    except PyMongoError:
        log.exception("Erro ao registrar voto")
        raise HTTPException(status_code=503, detail="Não foi possível registrar o voto agora.") from None

    if not resultado.registrado:
        return RespostaVoto(votou=True, pode_votar_em=resultado.pode_votar_em)
    _cache_avaliacoes(request).pop(praia_id, None)
    msg = "Avaliação atualizada" if resultado.atualizado else "Voto registrado com sucesso"
    return RespostaVoto(votou=False, atualizado=resultado.atualizado, msg=msg)
