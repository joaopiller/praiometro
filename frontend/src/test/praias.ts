import type { PontoDaPraia, PraiaResumo } from '../api/types';

export const trecho = (codigo: string, local = '', coords: [number, number] | null = null): PontoDaPraia => ({
    codigo,
    local,
    coordenadas: null,
    coordenadas_terra: coords,
    balneabilidade: null,
});

export const praiaDeTeste = (id: string, nome: string, pontos: PontoDaPraia[], centro: [number, number] | null = null): PraiaResumo => ({
    id,
    ordem: 0,
    nome,
    cidade: 'niteroi',
    bairro: '',
    principal: pontos[0].codigo,
    centro,
    situacao: 'sem_dados',
    pontos_proprios: 0,
    pontos_com_dados: 0,
    pontos,
});
