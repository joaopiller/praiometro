from typing import Literal

from fastapi import APIRouter, Depends, Query, Request
from fastapi.responses import Response

from ..deps import get_pontos, obter_ponto
from ..schemas import DadosPonto, ListaPontos, PontoResumo

router = APIRouter(prefix="/pontos", tags=["pontos"])

METEO = (
    "temperature_2m",
    "precipitation",
    "precipitation_probability",
    "rain",
    "relative_humidity_2m",
    "apparent_temperature",
    "wind_speed_10m",
    "wind_direction_10m",
    "uv_index",
    "weather_code",
    "choveu_8_horas",
)
MARINE = ("wave_height", "wave_period", "balneabilidade", "balneabilidade_data")


def _montar_lista(pontos: dict) -> ListaPontos:
    resumo = []
    # o catálogo segue o litoral (ordem dos boletins do INEA), então a posição nele é a ordem
    for ordem, (codigo, info) in enumerate(pontos.items()):
        leitura = info.get("leitura_atual") or {}
        resumo.append(
            PontoResumo(
                codigo=codigo,
                ordem=ordem,
                nome=info.get("nome") or [],
                specific_location=info.get("specific_location") or [],
                coordenadas=info.get("coordenadas_decimais"),
                coordenadas_terra=info.get("coordenadas_terra_decimais"),
                ultima_leitura=leitura.get("timestamp"),
                balneabilidade=leitura.get("balneabilidade"),
                balneabilidade_data=leitura.get("balneabilidade_data"),
                mar=info.get("mar"),
            )
        )
    return ListaPontos(pontos=resumo)


@router.get("", response_model=ListaPontos, summary="Lista todos os pontos de coleta")
async def listar_pontos(request: Request, pontos: dict = Depends(get_pontos)):
    # a lista só muda quando o arquivo de estado muda; serializa uma vez por versão
    cache = request.app.state.cache
    versao, corpo = getattr(request.app.state, "lista_pontos", (None, b""))
    if versao != cache.versao:
        corpo = _montar_lista(pontos).model_dump_json().encode()
        request.app.state.lista_pontos = (cache.versao, corpo)
    return Response(corpo, media_type="application/json")


@router.get("/{codigo}", summary="Detalha um ponto de coleta (leitura atual e previsão)")
async def detalhar_ponto(codigo: str, pontos: dict = Depends(get_pontos)) -> dict:
    return obter_ponto(pontos, codigo)


@router.get("/{codigo}/dados", response_model=DadosPonto, summary="Dados meteorológicos e/ou marítimos")
async def obter_dados(
    codigo: str,
    tipo: Literal["meteo", "marine", "ambos"] = Query("ambos"),
    pontos: dict = Depends(get_pontos),
):
    leitura = obter_ponto(pontos, codigo).get("leitura_atual") or {}
    chaves = (METEO if tipo in ("meteo", "ambos") else ()) + (MARINE if tipo in ("marine", "ambos") else ())
    return DadosPonto(
        codigo=codigo,
        timestamp=leitura.get("timestamp"),
        dados={c: leitura[c] for c in chaves if c in leitura},
    )
