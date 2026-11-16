import logging

from fastapi import APIRouter, Depends, HTTPException, Request
from pymongo.errors import PyMongoError

from ...auth import TokenInvalidoError, VerificadorTokens
from ...relatos import RelatoRecusadoError, RepositorioRelatos
from ..deps import get_limitador, get_pontos, get_relatos, get_token, get_verificador, obter_ponto
from ..ratelimit import LimitadorTaxa
from ..schemas import ListaRelatos, NovoRelato

log = logging.getLogger(__name__)
router = APIRouter(prefix="/pontos/{codigo}/relatos", tags=["relatos"])


def _usuario(token: str, verificador: VerificadorTokens) -> str:
    try:
        return verificador(token)
    except TokenInvalidoError:
        raise HTTPException(status_code=401, detail="Login expirado ou inválido. Entre novamente.") from None


def _limitar(request: Request, limitador: LimitadorTaxa) -> None:
    if not limitador.permitir(request.client.host if request.client else "?"):
        raise HTTPException(status_code=429, detail="Muitas tentativas. Aguarde um minuto.")


# def síncrono: pymongo bloqueia, então roda no threadpool
@router.get("", response_model=ListaRelatos, summary="Relatos ativos dos banhistas")
def listar_relatos(
    codigo: str, pontos: dict = Depends(get_pontos), relatos: RepositorioRelatos = Depends(get_relatos)
):
    obter_ponto(pontos, codigo)
    try:
        return ListaRelatos(relatos=relatos.listar(codigo), disponivel=True)
    except PyMongoError as e:
        log.warning("Relatos indisponíveis: %s", e)
        return ListaRelatos(relatos=[], disponivel=False)


@router.post("", status_code=204, summary="Envia um relato (ou confirma um existente)")
def enviar_relato(
    codigo: str,
    relato: NovoRelato,
    request: Request,
    token: str = Depends(get_token),
    pontos: dict = Depends(get_pontos),
    relatos: RepositorioRelatos = Depends(get_relatos),
    verificador: VerificadorTokens = Depends(get_verificador),
    limitador: LimitadorTaxa = Depends(get_limitador),
):
    _limitar(request, limitador)
    ponto = obter_ponto(pontos, codigo)
    coordenadas = ponto.get("coordenadas_terra_decimais") or ponto.get("coordenadas_decimais")
    if not coordenadas:
        raise HTTPException(status_code=400, detail="Praia sem coordenadas cadastradas")
    user_id = _usuario(token, verificador)
    try:
        relatos.registrar(
            codigo,
            user_id,
            relato.tipo,
            (relato.latitude, relato.longitude),
            (coordenadas[0], coordenadas[1]),
        )
    except RelatoRecusadoError as e:
        raise HTTPException(status_code=e.status, detail=str(e)) from None
    except PyMongoError:
        log.exception("Erro ao registrar relato")
        raise HTTPException(status_code=503, detail="Não foi possível enviar o relato agora.") from None


@router.post("/{tipo}/denuncia", status_code=204, summary="Denuncia um relato como falso")
def denunciar_relato(
    codigo: str,
    tipo: str,
    request: Request,
    token: str = Depends(get_token),
    pontos: dict = Depends(get_pontos),
    relatos: RepositorioRelatos = Depends(get_relatos),
    verificador: VerificadorTokens = Depends(get_verificador),
    limitador: LimitadorTaxa = Depends(get_limitador),
):
    _limitar(request, limitador)
    obter_ponto(pontos, codigo)
    user_id = _usuario(token, verificador)
    try:
        relatos.denunciar(codigo, user_id, tipo)
    except RelatoRecusadoError as e:
        raise HTTPException(status_code=e.status, detail=str(e)) from None
    except PyMongoError:
        log.exception("Erro ao registrar denúncia")
        raise HTTPException(status_code=503, detail="Não foi possível enviar a denúncia agora.") from None
