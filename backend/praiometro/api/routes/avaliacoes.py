import logging
import time
from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from pymongo.errors import PyMongoError

from ...auth import TokenInvalidoError, VerificadorTokens
from ...avaliacoes import RepositorioVotos
from ...config import Settings
from ..deps import get_limitador, get_pontos, get_repo, get_settings, get_token, get_verificador, obter_praia
from ..ratelimit import LimitadorTaxa
from ..schemas import Avaliacao, RespostaVoto, VotoIn

log = logging.getLogger(__name__)
router = APIRouter(tags=["avaliações"])

_TTL = 60.0


def _cache_avaliacoes(request: Request) -> dict:
    return request.app.state.cache_avaliacoes


@router.get("/praias/{praia_id}/avaliacao", response_model=Avaliacao, summary="Médias de avaliação da praia")
@router.get(
    "/pontos/{praia_id}/avaliacao", response_model=Avaliacao, deprecated=True, include_in_schema=False
)
def obter_avaliacao(
    praia_id: str,
    request: Request,
    pontos: dict = Depends(get_pontos),
    repo: RepositorioVotos = Depends(get_repo),
):
    praia = obter_praia(pontos, praia_id)
    codigo = praia["id"]
    ponto = pontos[praia["principal"]]
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


# def síncrono: pymongo e google-auth bloqueiam, então rodam no threadpool
@router.post("/votar", response_model=RespostaVoto, summary="Registra a avaliação do usuário")
def votar(
    votos: VotoIn,
    request: Request,
    praia_id: str = Query(..., description="Id da praia (IC) ou código de um ponto dela"),
    token: str = Depends(get_token),
    pontos: dict = Depends(get_pontos),
    repo: RepositorioVotos = Depends(get_repo),
    verificador: VerificadorTokens = Depends(get_verificador),
    limitador: LimitadorTaxa = Depends(get_limitador),
    settings: Settings = Depends(get_settings),
):
    ip = request.client.host if request.client else "?"
    if not limitador.permitir(ip):
        raise HTTPException(status_code=429, detail="Muitas tentativas. Aguarde um minuto.")

    praia_id = obter_praia(pontos, praia_id)["id"]
    try:
        user_id = verificador(token)
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
