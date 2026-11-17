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
    ordem: int = Field(0, description="Posição ao longo do litoral, dentro da cidade")
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


class PontoDaPraia(BaseModel):
    codigo: str
    local: str = Field("", description="Referência do ponto dentro da praia (vazio no ponto principal)")
    coordenadas: list[float] | None = None
    coordenadas_terra: list[float] | None = None
    balneabilidade: bool | None = None
    balneabilidade_data: str | None = None


class PraiaResumo(BaseModel):
    id: str = Field(description="IC para Icaraí; no Rio, o nome (copacabana)")
    ordem: int = Field(description="Posição ao longo do litoral, dentro da cidade")
    nome: str
    cidade: Literal["niteroi", "rio"]
    bairro: str = ""
    principal: str = Field(description="Ponto de onde vêm clima e mar")
    centro: list[float] | None = Field(
        None, description="[lat, lon] do pin no mapa, no meio da faixa de areia"
    )
    mar: str | None = None
    situacao: Literal["propria", "impropria", "parcial", "sem_dados"]
    pontos_proprios: int
    pontos_com_dados: int
    balneabilidade_data: str | None = Field(None, description="Boletim mais recente entre os pontos")
    ultima_leitura: str | None = None
    pontos: list[PontoDaPraia]


class ListaPraias(BaseModel):
    praias: list[PraiaResumo]


class Destaque(BaseModel):
    tipo: Literal["atencao", "dica", "curiosidade"]
    icone: str = Field(
        description="Nome do desenho; o app escolhe o ícone (ex.: mar-forte, trilha, por-do-sol)"
    )
    texto: str


class Atividade(BaseModel):
    nome: str
    icone: str = Field(description="Nome do desenho; o app escolhe o ícone (ex.: surfe, remo, trilha)")


class PraiaDetalhe(PraiaResumo):
    leitura_atual: dict | None = Field(None, description="Leitura do ponto principal")
    previsao: list[dict] = []
    destaques: list[Destaque] = Field([], description="O que a praia tem de singular; avisos primeiro")
    atividades: list[Atividade] = Field([], description="Atividades comuns na praia")
    criancas: str | None = Field(None, description="Por que a praia é boa para crianças, se for")


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
    coleta_embutida: bool = False
    ultima_coleta: str | None = Field(None, description="Quando o estado foi gravado pela última vez (UTC)")
    pontos_com_leitura: int = 0
    pontos_com_boletim: int = 0
    fontes: dict[str, str] = Field(
        {}, description="Última tentativa em cada fonte (só com a coleta embutida)"
    )


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

    tipo: str | None = Field(None, description="Um relato só (versões antigas do app)")
    tipos: list[str] = Field([], max_length=8, description="Vários relatos enviados juntos")
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
