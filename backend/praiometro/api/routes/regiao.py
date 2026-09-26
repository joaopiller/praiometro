from datetime import date, timedelta

from fastapi import APIRouter, Depends, Query, Request

from ..deps import get_pontos, obter_ponto
from ..schemas import Historico, Regiao, RegistroHistorico

router = APIRouter(tags=["região"])


@router.get("/regiao", response_model=Regiao, summary="Maré e nascer/pôr do sol em Niterói")
async def obter_regiao(request: Request):
    return request.app.state.cache_regiao.dados or {}


@router.get("/pontos/{codigo}/historico", response_model=Historico, summary="Histórico de balneabilidade")
async def obter_historico(
    codigo: str,
    request: Request,
    dias: int = Query(365, ge=7, le=3650),
    pontos: dict = Depends(get_pontos),
):
    ponto = obter_ponto(pontos, codigo)
    registros = request.app.state.cache_historico.dados.get(ponto.get("codigo_inea", codigo), {})
    desde = (date.today() - timedelta(days=dias)).isoformat()
    lista = [RegistroHistorico(data=d, propria=p) for d, p in sorted(registros.items()) if d >= desde]
    proprias = sum(r.propria for r in lista)
    return Historico(
        codigo=codigo,
        registros=lista,
        total=len(lista),
        proprias=proprias,
        percentual_proprio=round(100 * proprias / len(lista), 1) if lista else None,
    )
