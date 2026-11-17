import { axiosError } from '../../test/render';
import { getErrorMessage } from '../client';

describe('getErrorMessage', () => {
    it('usa a mensagem do servidor quando existe', () => {
        expect(getErrorMessage(axiosError(429, 'Muitas tentativas. Aguarde um minuto.'))).toBe(
            'Muitas tentativas. Aguarde um minuto.',
        );
    });

    it('trata timeout, falta de rede e erro do servidor', () => {
        expect(getErrorMessage(axiosError(undefined, undefined, 'ECONNABORTED'))).toMatch(/não respondeu/);
        expect(getErrorMessage(axiosError())).toMatch(/Sem conexão/);
        expect(getErrorMessage(axiosError(502))).toMatch(/servidor está com problemas/);
    });

    it('ignora detail que não é texto (ex.: lista de validação)', () => {
        expect(getErrorMessage(axiosError(400, [{ msg: 'x' }]))).toBe('Algo deu errado. Tente novamente.');
    });

    it('erro genérico', () => {
        expect(getErrorMessage(new Error('x'))).toBe('Algo deu errado. Tente novamente.');
    });
});

describe('novas tentativas', () => {
    const { createQueryClient } = require('../queryClient');
    const retry = createQueryClient().getDefaultOptions().queries.retry as (falhas: number, erro: unknown) => boolean;
    const semResposta = axiosError(undefined, undefined, 'ECONNABORTED');

    it('servidor que não responde pode estar voltando do repouso: insiste por cerca de um minuto', () => {
        expect(retry(0, semResposta)).toBe(true);
        expect(retry(5, semResposta)).toBe(true);
        expect(retry(6, semResposta)).toBe(false);
    });

    it('outras falhas ganham uma segunda chance, e só uma', () => {
        expect(retry(0, axiosError(502))).toBe(true);
        expect(retry(1, axiosError(502))).toBe(false);
    });
});
