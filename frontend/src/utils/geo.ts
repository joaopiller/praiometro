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

/** Distância até a linha que liga os lugares, na ordem (com um lugar só, até ele). */
function distanciaAteFaixa(origem: Coordenada, lugares: Coordenada[]): number {
    if (lugares.length === 1) return distanciaKm(origem, lugares[0]);
    // plano local em km, com origem em quem pergunta
    const kmLon = 111.32 * Math.cos(rad(origem.latitude));
    const xy = lugares.map((l) => [(l.longitude - origem.longitude) * kmLon, (l.latitude - origem.latitude) * 110.57]);
    let menor = Infinity;
    for (let i = 0; i < xy.length - 1; i++) {
        const [x1, y1] = xy[i];
        const [dx, dy] = [xy[i + 1][0] - x1, xy[i + 1][1] - y1];
        const tamanho = dx * dx + dy * dy;
        const t = tamanho === 0 ? 0 : Math.max(0, Math.min(1, -(x1 * dx + y1 * dy) / tamanho));
        menor = Math.min(menor, Math.hypot(x1 + t * dx, y1 + t * dy));
    }
    return menor;
}

/**
 * Distância até a parte mais próxima da praia: a faixa entre os trechos, na ordem do
 * litoral, ou o meio dela. O servidor usa a mesma conta para aceitar um relato.
 */
export function distanciaAtePraia(praia: PraiaResumo, origem: Coordenada): number | null {
    const trechos = praia.pontos.flatMap((p) => paraCoordenada(p.coordenadas_terra ?? p.coordenadas) ?? []);
    const centro = centroDaPraia(praia);
    const km = [
        ...(trechos.length ? [distanciaAteFaixa(origem, trechos)] : []),
        ...(centro ? [distanciaKm(origem, centro)] : []),
    ];
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
