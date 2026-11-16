import { direcaoVento, nivelBalneabilidade, nivelOnda, nivelUV, nivelVento } from '../risk';

describe('níveis de risco', () => {
    it('ondas', () => {
        expect(nivelOnda(0.3).tom).toBe('success');
        expect(nivelOnda(0.5).rotulo).toBe('Moderado');
        expect(nivelOnda(2.1).tom).toBe('danger');
        expect(nivelOnda(null).tom).toBe('neutral');
    });

    it('vento', () => {
        expect(nivelVento(10.4).rotulo).toBe('Fraco');
        expect(nivelVento(25).tom).toBe('warning');
        expect(nivelVento(40).tom).toBe('danger');
    });

    it('UV', () => {
        expect(nivelUV(0.4)).toMatchObject({ rotulo: 'Baixo', mensagem: 'Não requer proteção especial' });
        expect(nivelUV(9).rotulo).toBe('Muito alto');
        expect(nivelUV(12).rotulo).toBe('Extremo');
        expect(nivelUV(undefined).rotulo).toBe('Sem dados');
    });

    it('balneabilidade sem informação não é mostrada como imprópria', () => {
        expect(nivelBalneabilidade(true).mensagem).toBe('Própria para banho');
        expect(nivelBalneabilidade(false).mensagem).toBe('Imprópria para banho');
        expect(nivelBalneabilidade(null).tom).toBe('neutral');
        expect(nivelBalneabilidade(undefined).mensagem).toMatch(/sem informação/i);
    });

    it('direção do vento', () => {
        expect(direcaoVento(0)).toBe('Norte (N)');
        expect(direcaoVento(135)).toBe('Sudeste (SE)');
        expect(direcaoVento(350)).toBe('Norte (N)');
        expect(direcaoVento(-45)).toBe('Noroeste (NO)');
        expect(direcaoVento(null)).toBeNull();
    });
});
