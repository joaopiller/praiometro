import type { Coordenada } from '../utils/geo';

export type Cidade = 'niteroi' | 'rio';

interface InfoCidade {
    nome: string;
    /** nome curto, para cards e botões */
    curto: string;
    estado: string;
    /** lugares de referência para descobrir em que cidade a pessoa está */
    referencias: Coordenada[];
}

export const CIDADES: Record<Cidade, InfoCidade> = {
    niteroi: {
        nome: 'Niterói',
        curto: 'Niterói',
        estado: 'Rio de Janeiro',
        referencias: [
            { latitude: -22.9, longitude: -43.11 },
            { latitude: -22.955, longitude: -43.06 },
        ],
    },
    rio: {
        nome: 'Rio de Janeiro',
        curto: 'Rio de Janeiro',
        estado: 'Rio de Janeiro',
        referencias: [
            { latitude: -22.97, longitude: -43.19 },
            { latitude: -23.0, longitude: -43.36 },
            { latitude: -22.93, longitude: -43.18 },
        ],
    },
};

export const ORDEM_CIDADES: Cidade[] = ['niteroi', 'rio'];

// O modelo de clima (~10 km) enxerga cada cidade em duas áreas. Cada uma usa um ponto
// de coleta representativo e um lugar de referência para achar a mais próxima.
export const ZONAS_CLIMA = [
    { id: 'centro', cidade: 'niteroi', rotulo: 'Centro e baía', ponto: 'GR000', lugar: { latitude: -22.9, longitude: -43.12 } },
    { id: 'oceanica', cidade: 'niteroi', rotulo: 'Região Oceânica', ponto: 'PR001', lugar: { latitude: -22.955, longitude: -43.06 } },
    { id: 'zona-sul', cidade: 'rio', rotulo: 'Zona Sul', ponto: 'CP005', lugar: { latitude: -22.97, longitude: -43.19 } },
    { id: 'barra', cidade: 'rio', rotulo: 'Barra e Recreio', ponto: 'BD007', lugar: { latitude: -23.01, longitude: -43.38 } },
] as const satisfies readonly { id: string; cidade: Cidade; rotulo: string; ponto: string; lugar: Coordenada }[];

export type ZonaClima = (typeof ZONAS_CLIMA)[number]['id'];
