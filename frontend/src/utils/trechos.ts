import type { PraiaResumo } from '../api/types';
import { formatDate } from './format';

/** Linha de apoio do card: quantos trechos estão bons, ou de quando é a informação. */
export function resumoDaPraia(praia: Pick<PraiaResumo, 'situacao' | 'pontos' | 'pontos_proprios' | 'balneabilidade_data'>): string {
    if (praia.situacao === 'parcial') return `Própria em ${praia.pontos_proprios} de ${praia.pontos.length} trechos`;
    return praia.balneabilidade_data ? `Boletim de ${formatDate(`${praia.balneabilidade_data}T00:00`)}` : 'Sem boletim recente';
}
