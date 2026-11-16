import type { Cidade } from '../config/cidades';

/** Leitura horária de um ponto (formato devolvido pela API). */
export interface Leitura {
    timestamp?: string;
    temperature_2m?: number | null;
    apparent_temperature?: number | null;
    precipitation?: number | null;
    precipitation_probability?: number | null;
    rain?: number | null;
    relative_humidity_2m?: number | null;
    wind_speed_10m?: number | null;
    wind_direction_10m?: number | null;
    uv_index?: number | null;
    weather_code?: number | null;
    wave_height?: number | null;
    wave_period?: number | null;
    sea_surface_temperature?: number | null;
    choveu_8_horas?: boolean;
    /** true = própria, false = imprópria, null = sem informação */
    balneabilidade?: boolean | null;
    /** data do boletim do INEA (AAAA-MM-DD) */
    balneabilidade_data?: string | null;
}

export type TipoMar = 'baia' | 'oceanico';

export interface PrevisaoHora {
    hora: string;
    temperature_2m: number | null;
    precipitation_probability: number | null;
    weather_code: number | null;
    uv_index: number | null;
    wave_height: number | null;
}

/** Situação da praia somando os pontos de coleta dela */
export type SituacaoPraia = 'propria' | 'impropria' | 'parcial' | 'sem_dados';

/** Ponto de coleta do INEA dentro da praia (no app, um "trecho") */
export interface PontoDaPraia {
    codigo: string;
    /** referência do ponto (vazia no ponto principal) */
    local: string;
    coordenadas: [number, number] | null;
    coordenadas_terra: [number, number] | null;
    balneabilidade: boolean | null;
    balneabilidade_data?: string | null;
}

export interface PraiaResumo {
    /** prefixo dos códigos dos pontos (IC para Icaraí) */
    id: string;
    ordem: number;
    nome: string;
    cidade: Cidade;
    bairro: string;
    /** ponto de onde vêm clima e mar */
    principal: string;
    /** [lat, lon] do pin, no meio da faixa de areia */
    centro: [number, number] | null;
    mar?: TipoMar | null;
    situacao: SituacaoPraia;
    pontos_proprios: number;
    pontos_com_dados: number;
    balneabilidade_data?: string | null;
    ultima_leitura?: string | null;
    pontos: PontoDaPraia[];
}

export interface PraiaDetalhe extends PraiaResumo {
    leitura_atual?: Leitura | null;
    previsao?: PrevisaoHora[];
}

export interface PontoDetalhe {
    nome: string[];
    specific_location?: string[];
    coordenadas_decimais?: [number, number];
    coordenadas_terra_decimais?: [number, number];
    mar?: TipoMar;
    leitura_atual?: Leitura;
    previsao?: PrevisaoHora[];
}

export const CRITERIOS = [
    { key: 'limpeza', label: 'Limpeza' },
    { key: 'acessibilidade', label: 'Acessibilidade' },
    { key: 'infraestrutura', label: 'Infraestrutura' },
    { key: 'seguranca', label: 'Segurança' },
    { key: 'tranquilidade', label: 'Tranquilidade' },
] as const;

export type Criterio = (typeof CRITERIOS)[number]['key'];
export type Notas = Record<Criterio, number>;

export interface Avaliacao {
    praia_id: string;
    avaliacao_media: Notas | null;
    medias_exatas?: Notas | null;
    /** Média de todos os critérios (0,5 a 5) */
    nota_geral?: number | null;
    total_avaliacoes?: number | null;
}

export interface RespostaVoto {
    /** true = voto NÃO registrado (já votou recentemente) */
    votou: boolean;
    /** true = substituiu uma avaliação anterior do usuário */
    atualizado?: boolean;
    msg?: string | null;
    pode_votar_em?: string | null;
}

export interface Historico {
    codigo: string;
    registros: { data: string; propria: boolean }[];
    total: number;
    proprias: number;
    percentual_proprio: number | null;
}

export interface ExtremoMare {
    hora: string;
    nivel: number;
    tipo: 'alta' | 'baixa';
}

export interface Regiao {
    mare: { serie: { hora: string; nivel: number | null }[]; extremos: ExtremoMare[] } | null;
    sol: { data: string; nascer: string; por: string }[];
}

export type TipoRelato =
    | 'lotada'
    | 'tranquila'
    | 'agua_viva'
    | 'lixo'
    | 'mar_agitado'
    | 'bandeira_vermelha'
    | 'agua_turva'
    | 'agua_limpa';

export interface Relato {
    tipo: TipoRelato;
    rotulo: string;
    confirmacoes: number;
    ultimo_em: string;
}

export interface ListaRelatos {
    relatos: Relato[];
    disponivel: boolean;
}
