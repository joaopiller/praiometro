import type { PontoResumo } from '../api/types';

export function normalize(texto: string): string {
    return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

// "Praia de Adão" → "Adão", para ordenar pelo nome que importa
export function nomeSemPrefixo(nome: string): string {
    return nome.replace(/^praia (d[aeo]s?|de)\s+/i, '');
}

export function nomePrincipal(ponto: Pick<PontoResumo, 'nome'>): string {
    return ponto.nome?.[0] || 'Praia';
}

export function localEspecifico(ponto: Pick<PontoResumo, 'specific_location'>): string {
    return ponto.specific_location?.find((l) => l.trim()) ?? '';
}

export function matchesBeach(ponto: PontoResumo, busca: string): boolean {
    const termo = normalize(busca);
    if (!termo) return true;
    return [...(ponto.nome ?? []), ...(ponto.specific_location ?? [])].some((t) => normalize(t).includes(termo));
}
