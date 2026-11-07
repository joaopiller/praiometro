import { axiosError } from '../../test/render';
import { getErrorMessage } from '../client';

describe('getErrorMessage', () => {
    it('usa a mensagem do servidor quando existe', () => {
        expect(getErrorMessage(axiosError(429, 'Muitas tentativas. Aguarde um minuto.'))).toBe(
            'Muitas tentativas. Aguarde um minuto.',
        );
    });

    it('trata timeout, falta de rede e erro do servidor', () => {
        expect(getErrorMessage(axiosError(undefined, undefined, 'ECONNABORTED'))).toMatch(/demorou/);
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
