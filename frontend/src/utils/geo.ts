import type { PontoResumo } from '../api/types';

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

export function coordenadaDoPonto(p: PontoResumo): Coordenada | null {
    const c = p.coordenadas_terra ?? p.coordenadas;
    return c?.length === 2 ? { latitude: c[0], longitude: c[1] } : null;
}

/** Pontos com distância até `origem`, do mais perto para o mais longe. */
export function ordenarPorDistancia(pontos: PontoResumo[], origem: Coordenada) {
    return pontos
        .flatMap((p) => {
            const c = coordenadaDoPonto(p);
            return c ? [{ ponto: p, km: distanciaKm(origem, c) }] : [];
        })
        .sort((a, b) => a.km - b.km);
}
