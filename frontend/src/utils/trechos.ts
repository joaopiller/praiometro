import type { PraiaResumo } from '../api/types';
import { CIDADES } from '../config/cidades';

/** Onde fica a praia: "Icaraí, Niterói". */
export function ondeFica(praia: Pick<PraiaResumo, 'bairro' | 'cidade'>): string {
    const cidade = CIDADES[praia.cidade]?.curto ?? '';
    return [praia.bairro, cidade].filter(Boolean).join(', ');
}
