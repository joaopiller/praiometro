import { descreverBoletim, tempoDesde, formatDate, formatHour, formatNumber, formatTemp, formatUpdated, isStale, parseTimestamp } from '../format';

// 16/11/2026 15:30 em Niterói = 18:30 UTC
const AGORA = new Date(Date.UTC(2026, 10, 16, 18, 30));

describe('format', () => {
    it('faz o parse sem depender do fuso do aparelho', () => {
        expect(parseTimestamp('2026-11-16T14:00')).toEqual({ ano: 2026, mes: 11, dia: 16, hora: 14, minuto: 0 });
        expect(parseTimestamp('lixo')).toBeNull();
        expect(parseTimestamp(undefined)).toBeNull();
    });

    it('formata hora e data', () => {
        expect(formatHour('2026-11-16T09:00')).toBe('09:00');
        expect(formatDate('2026-02-03T09:00')).toBe('03/02');
        expect(formatHour(null)).toBe('--:--');
    });

    it('descreve quando foi atualizado', () => {
        expect(formatUpdated('2026-11-16T15:00', AGORA)).toBe('hoje às 15:00');
        expect(formatUpdated('2026-11-15T23:00', AGORA)).toBe('ontem às 23:00');
        expect(formatUpdated('2026-11-01T10:00', AGORA)).toBe('dia 01/11 às 10:00');
        expect(formatUpdated(undefined, AGORA)).toBe('sem dados recentes');
    });

    it('detecta dados desatualizados', () => {
        expect(isStale('2026-11-16T15:00', 3, AGORA)).toBe(false);
        expect(isStale('2026-11-16T11:00', 3, AGORA)).toBe(true);
        expect(isStale(null, 3, AGORA)).toBe(true);
    });

    it('usa vírgula decimal e trata vazios', () => {
        expect(formatNumber(0.55)).toBe('0,6');
        expect(formatNumber(10.4, 1)).toBe('10,4');
        expect(formatNumber(null)).toBe('–');
        expect(formatTemp(27.6)).toBe('28°');
        expect(formatTemp(undefined)).toBe('–');
    });

    it('descreve a data do boletim', () => {
        expect(descreverBoletim('2026-11-12', AGORA)).toBe('Boletim do INEA de 12/11 (há 4 dias)');
        expect(descreverBoletim('2026-11-15', AGORA)).toBe('Boletim do INEA de 15/11 (ontem)');
        expect(descreverBoletim('2026-11-16', AGORA)).toBe('Boletim do INEA de 16/11 (hoje)');
        expect(descreverBoletim(null, AGORA)).toBe('Boletim do INEA');
    });

    it('descreve há quanto tempo', () => {
        expect(tempoDesde('2026-11-16T18:29:30Z', AGORA)).toBe('agora');
        expect(tempoDesde('2026-11-16T18:10:00Z', AGORA)).toBe('há 20 min');
        expect(tempoDesde('2026-11-16T15:00:00Z', AGORA)).toBe('há 3 h');
    });
});
