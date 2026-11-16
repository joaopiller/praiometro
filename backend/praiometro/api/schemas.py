from datetime import date
from typing import Annotated, Literal

from pydantic import BaseModel, ConfigDict, Field

# 0,5 a 5 em passos de meia estrela; strict recusa "5" e True
Nota = Annotated[float, Field(strict=True, ge=0.5, le=5, multiple_of=0.5)]


class VotoIn(BaseModel):
    model_config = ConfigDict(extra="forbid")

    limpeza: Nota
    acessibilidade: Nota
    infraestrutura: Nota
    seguranca: Nota
    tranquilidade: Nota


class PontoResumo(BaseModel):
    codigo: str
    nome: list[str]
    specific_location: list[str] = []
    coordenadas: list[float] | None = None
    coordenadas_terra: list[float] | None = None
    ultima_leitura: str | None = None
    balneabilidade: bool | None = None
    balneabilidade_data: str | None = None
    mar: str | None = None


class ListaPontos(BaseModel):
    pontos: list[PontoResumo]


class DadosPonto(BaseModel):
    codigo: str
    timestamp: str | None
    dados: dict


class Avaliacao(BaseModel):
    praia_id: str
    avaliacao_media: dict[str, float] | None = Field(description="Médias arredondadas para meia estrela")
    medias_exatas: dict[str, float] | None = None
    nota_geral: float | None = Field(None, description="Média de todos os critérios (0,5 a 5)")
    total_avaliacoes: int | None = 0


class RespostaVoto(BaseModel):
    votou: bool = Field(description="True se o voto NÃO foi registrado por ter votado recentemente")
    atualizado: bool = Field(False, description="True se substituiu uma avaliação anterior do usuário")
    msg: str | None = None
    pode_votar_em: date | None = None


class Health(BaseModel):
    status: Literal["ok", "degradado"]
    versao: str
    pontos: int
    mongo: bool


class RegistroHistorico(BaseModel):
    data: str
    propria: bool


class Historico(BaseModel):
    codigo: str
    registros: list[RegistroHistorico]
    total: int
    proprias: int
    percentual_proprio: float | None


class PontoMare(BaseModel):
    hora: str
    nivel: float | None


class ExtremoMare(BaseModel):
    hora: str
    nivel: float
    tipo: Literal["alta", "baixa"]


class Mare(BaseModel):
    serie: list[PontoMare]
    extremos: list[ExtremoMare]


class Sol(BaseModel):
    data: str
    nascer: str
    por: str
    duracao_s: float | None = None


class Regiao(BaseModel):
    mare: Mare | None = None
    sol: list[Sol] = []


class NovoRelato(BaseModel):
    model_config = ConfigDict(extra="forbid")

    tipo: str
    latitude: float = Field(ge=-90, le=90)
    longitude: float = Field(ge=-180, le=180)


class Relato(BaseModel):
    tipo: str
    rotulo: str
    confirmacoes: int
    ultimo_em: str


class ListaRelatos(BaseModel):
    relatos: list[Relato]
    disponivel: bool = Field(description="False quando o banco de relatos está fora do ar")
