import type { PontoDaPraia, PraiaResumo } from '../api/types';

export function normalize(texto: string): string {
    return texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();
}

// "Praia de Adão" → "Adão", para ordenar pelo nome que importa
export function nomeSemPrefixo(nome: string): string {
    return nome.replace(/^praia (d[aeo]s?|de)\s+/i, '');
}

/** Nome curto para o mapa: "Praia de Icaraí" → "Icaraí" */
export function nomeCurto(nome: string): string {
    return nomeSemPrefixo(nome) || nome;
}

/** Como o trecho aparece para quem usa o app */
export function nomeDoTrecho(ponto: Pick<PontoDaPraia, 'local'>): string {
    return ponto.local || 'Trecho principal';
}

/** Busca pelo nome da praia ou pela referência de qualquer trecho dela ("mariz e barros" acha Icaraí). */
export function buscaPraia(praia: PraiaResumo, busca: string): boolean {
    const termo = normalize(busca);
    if (!termo) return true;
    return [praia.nome, ...praia.pontos.map((p) => p.local)].some((t) => normalize(t).includes(termo));
}
