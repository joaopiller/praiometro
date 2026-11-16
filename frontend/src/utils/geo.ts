import type { PraiaResumo } from '../api/types';

export interface Coordenada {
    latitude: number;
    longitude: number;
}

const RAIO_TERRA_KM = 6371;
const rad = (graus: number) => (graus * Math.PI) / 180;

export function distanciaKm(a: Coordenada, b: Coordenada): number {
    const dLat = rad(b.latitude - a.latitude);
    const dLon = rad(b.longitude - a.longitude);
    const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dLon / 2) ** 2;
    return 2 * RAIO_TERRA_KM * Math.asin(Math.sqrt(h));
}

export function formatDistancia(km: number): string {
    if (km < 1) return `${Math.max(10, Math.round((km * 1000) / 10) * 10)} m`;
    if (km < 10) return `${km.toFixed(1).replace('.', ',')} km`;
    return `${Math.round(km)} km`;
}

const paraCoordenada = (c: [number, number] | null | undefined): Coordenada | null =>
    c?.length === 2 ? { latitude: c[0], longitude: c[1] } : null;

/** Onde fica o pin da praia (meio da areia) ou, sem ele, o ponto principal. */
export function centroDaPraia(praia: PraiaResumo): Coordenada | null {
    const principal = praia.pontos.find((p) => p.codigo === praia.principal);
    return paraCoordenada(praia.centro) ?? paraCoordenada(principal?.coordenadas_terra ?? principal?.coordenadas);
}

/** Distância até a parte mais próxima da praia (qualquer trecho ou o meio dela). */
export function distanciaAtePraia(praia: PraiaResumo, origem: Coordenada): number | null {
    const lugares = [centroDaPraia(praia), ...praia.pontos.map((p) => paraCoordenada(p.coordenadas_terra ?? p.coordenadas))];
    const km = lugares.flatMap((c) => (c ? [distanciaKm(origem, c)] : []));
    return km.length ? Math.min(...km) : null;
}

export function ordenarPraiasPorDistancia(praias: PraiaResumo[], origem: Coordenada) {
    return praias
        .flatMap((praia) => {
            const km = distanciaAtePraia(praia, origem);
            return km === null ? [] : [{ praia, km }];
        })
        .sort((a, b) => a.km - b.km);
}
