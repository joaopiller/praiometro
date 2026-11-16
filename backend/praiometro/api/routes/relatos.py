import logging

from fastapi import APIRouter, Depends, HTTPException, Request
from pymongo.errors import PyMongoError

from ...auth import TokenInvalidoError, VerificadorTokens
from ...relatos import RelatoRecusadoError, RepositorioRelatos
from ..deps import get_limitador, get_pontos, get_relatos, get_token, get_verificador, obter_praia
from ..ratelimit import LimitadorTaxa
from ..schemas import ListaRelatos, NovoRelato

log = logging.getLogger(__name__)
router = APIRouter(tags=["relatos"])


def _usuario(token: str, verificador: VerificadorTokens) -> str:
    try:
        return verificador(token)
    except TokenInvalidoError:
        raise HTTPException(status_code=401, detail="Login expirado ou inválido. Entre novamente.") from None


def _limitar(request: Request, limitador: LimitadorTaxa) -> None:
    if not limitador.permitir(request.client.host if request.client else "?"):
        raise HTTPException(status_code=429, detail="Muitas tentativas. Aguarde um minuto.")


# def síncrono: pymongo bloqueia, então roda no threadpool
@router.get("/praias/{codigo}/relatos", response_model=ListaRelatos, summary="Relatos ativos dos banhistas")
@router.get("/pontos/{codigo}/relatos", response_model=ListaRelatos, deprecated=True, include_in_schema=False)
def listar_relatos(
    codigo: str, pontos: dict = Depends(get_pontos), relatos: RepositorioRelatos = Depends(get_relatos)
):
    praia_id = obter_praia(pontos, codigo)["id"]
    try:
        return ListaRelatos(relatos=relatos.listar(praia_id), disponivel=True)
    except PyMongoError as e:
        log.warning("Relatos indisponíveis: %s", e)
        return ListaRelatos(relatos=[], disponivel=False)


@router.post(
    "/praias/{codigo}/relatos", status_code=204, summary="Envia um relato (ou confirma um existente)"
)
@router.post("/pontos/{codigo}/relatos", status_code=204, deprecated=True, include_in_schema=False)
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
    praia = obter_praia(pontos, codigo)
    # vale estar perto de qualquer ponto de coleta da praia
    locais = [
        (c[0], c[1])
        for p in praia["pontos"]
        if (c := pontos[p].get("coordenadas_terra_decimais") or pontos[p].get("coordenadas_decimais"))
    ]
    if not locais:
        raise HTTPException(status_code=400, detail="Praia sem coordenadas cadastradas")
    user_id = _usuario(token, verificador)
    try:
        tipos = relato.tipos or ([relato.tipo] if relato.tipo else [])
        relatos.registrar(praia["id"], user_id, tipos, (relato.latitude, relato.longitude), locais)
    except RelatoRecusadoError as e:
        raise HTTPException(status_code=e.status, detail=str(e)) from None
    except PyMongoError:
        log.exception("Erro ao registrar relato")
        raise HTTPException(status_code=503, detail="Não foi possível enviar o relato agora.") from None


@router.post(
    "/praias/{codigo}/relatos/{tipo}/denuncia", status_code=204, summary="Denuncia um relato como falso"
)
@router.post(
    "/pontos/{codigo}/relatos/{tipo}/denuncia", status_code=204, deprecated=True, include_in_schema=False
)
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
    praia_id = obter_praia(pontos, codigo)["id"]
    user_id = _usuario(token, verificador)
    try:
        relatos.denunciar(praia_id, user_id, tipo)
    except RelatoRecusadoError as e:
        raise HTTPException(status_code=e.status, detail=str(e)) from None
    except PyMongoError:
        log.exception("Erro ao registrar denúncia")
        raise HTTPException(status_code=503, detail="Não foi possível enviar a denúncia agora.") from None
