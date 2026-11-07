import type { PontoResumo } from '../../api/types';
import { distanciaKm, formatDistancia, ordenarPorDistancia } from '../geo';
import { estadoMare, solDeHoje } from '../mare';

const ponto = (codigo: string, lat: number, lon: number): PontoResumo => ({
    codigo,
    nome: [codigo],
    specific_location: [''],
    coordenadas: null,
    coordenadas_terra: [lat, lon],
    ultima_leitura: null,
    balneabilidade: null,
});

describe('geo', () => {
    it('calcula distância (Icaraí → Itacoatiara ≈ 10 km)', () => {
        const km = distanciaKm({ latitude: -22.905, longitude: -43.117 }, { latitude: -22.976, longitude: -43.031 });
        expect(km).toBeGreaterThan(11);
        expect(km).toBeLessThan(12.5);
    });

    it('formata distância', () => {
        expect(formatDistancia(0.004)).toBe('10 m');
        expect(formatDistancia(0.456)).toBe('460 m');
        expect(formatDistancia(1.234)).toBe('1,2 km');
        expect(formatDistancia(42.6)).toBe('43 km');
    });

    it('ordena pela distância e ignora pontos sem coordenada', () => {
        const pontos = [ponto('LONGE', -22.976, -43.031), ponto('PERTO', -22.906, -43.118), { ...ponto('X', 0, 0), coordenadas_terra: null }];
        const r = ordenarPorDistancia(pontos, { latitude: -22.905, longitude: -43.117 });
        expect(r.map((x) => x.ponto.codigo)).toEqual(['PERTO', 'LONGE']);
    });
});

describe('maré e sol', () => {
    // 16/11/2026 15:30 em Niterói
    const AGORA = new Date(Date.UTC(2026, 10, 16, 18, 30));
    const extremos = [
        { hora: '2026-11-16T13:00', nivel: 0.02, tipo: 'baixa' as const },
        { hora: '2026-11-16T17:40', nivel: 0.17, tipo: 'alta' as const },
        { hora: '2026-11-17T00:30', nivel: -0.24, tipo: 'baixa' as const },
    ];

    it('diz se está enchendo e a próxima maré', () => {
        const e = estadoMare(extremos, AGORA);
        expect(e?.tendencia).toBe('enchendo');
        expect(e?.proxima.hora).toBe('2026-11-16T17:40');
        expect(e?.seguinte?.tipo).toBe('baixa');
    });

    it('sem dados futuros', () => {
        expect(estadoMare(extremos.slice(0, 1), AGORA)).toBeNull();
        expect(estadoMare(undefined, AGORA)).toBeNull();
    });

    it('pega o sol do dia em Niterói', () => {
        const sol = [
            { data: '2026-11-16', nascer: '2026-11-16T05:00', por: '2026-11-16T18:14' },
            { data: '2026-11-17', nascer: '2026-11-17T04:59', por: '2026-11-17T18:14' },
        ];
        expect(solDeHoje(sol, AGORA)?.data).toBe('2026-11-16');
        // 23h30 em Niterói ainda é dia 16, mesmo já sendo 17 em UTC
        expect(solDeHoje(sol, new Date(Date.UTC(2026, 10, 17, 2, 30)))?.data).toBe('2026-11-16');
    });
});
