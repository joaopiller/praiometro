from fastapi import APIRouter, Depends, Request
from fastapi.responses import Response

from ...praias import agrupar, resumir
from ..deps import get_pontos, obter_praia
from ..schemas import ListaPraias, PraiaDetalhe

router = APIRouter(prefix="/praias", tags=["praias"])


@router.get("", response_model=ListaPraias, summary="Lista as praias, com a situação de cada ponto de coleta")
async def listar_praias(request: Request, pontos: dict = Depends(get_pontos)):
    # muda só quando o estado muda; serializa uma vez por versão
    cache = request.app.state.cache
    versao, corpo = getattr(request.app.state, "lista_praias", (None, b""))
    if versao != cache.versao:
        lista = ListaPraias(praias=[resumir(p, pontos) for p in agrupar(pontos).values()])
        corpo = lista.model_dump_json().encode()
        request.app.state.lista_praias = (cache.versao, corpo)
    return Response(corpo, media_type="application/json")


@router.get(
    "/{praia_id}", response_model=PraiaDetalhe, summary="Detalha uma praia (clima e mar do ponto principal)"
)
async def detalhar_praia(praia_id: str, pontos: dict = Depends(get_pontos)):
    praia = obter_praia(pontos, praia_id)
    principal = pontos[praia["principal"]]
    return PraiaDetalhe(
        **resumir(praia, pontos),
        leitura_atual=principal.get("leitura_atual"),
        previsao=principal.get("previsao") or [],
    )
