import { getCondicao, getHumidityMessage, getSensationMessage, isNoite } from '../weather';

describe('clima', () => {
    it('mapeia códigos WMO', () => {
        expect(getCondicao(0).descricao).toBe('Céu limpo');
        expect(getCondicao(3).descricao).toBe('Nublado');
        expect(getCondicao(48).descricao).toBe('Neblina');
        expect(getCondicao(95).arriscado).toBe(true);
        expect(getCondicao(1234).descricao).toBe('Sem informação');
        expect(getCondicao(null).descricao).toBe('Sem informação');
    });

    it('identifica noite', () => {
        expect(isNoite(5)).toBe(true);
        expect(isNoite(12)).toBe(false);
        expect(isNoite(19)).toBe(true);
    });

    it('mensagens toleram ausência de dados', () => {
        expect(getHumidityMessage(undefined)).toBe('Sem informação');
        expect(getSensationMessage(null)).toBe('Sem informação');
        expect(getSensationMessage(30)).toMatch(/protetor/);
    });
});
