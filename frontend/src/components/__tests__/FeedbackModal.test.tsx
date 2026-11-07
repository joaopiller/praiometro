import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import { enviarVoto } from '../../api/praiometro';
import { obterIdToken } from '../../auth/google';
import { axiosError, renderWithClient } from '../../test/render';
import FeedbackModal from '../FeedbackModal';

jest.mock('../../api/praiometro');
jest.mock('../../auth/google', () => {
    const real = jest.requireActual('../../auth/google');
    return { ...real, obterIdToken: jest.fn() };
});

const mockToken = obterIdToken as jest.Mock;
const mockVoto = enviarVoto as jest.Mock;

function avaliarTudo(locationX = 25) {
    for (let i = 0; i < 5; i++) {
        fireEvent.press(screen.getAllByTestId('estrela-4')[i], { nativeEvent: { locationX } });
    }
}

describe('FeedbackModal', () => {
    let alerta: jest.SpyInstance;
    beforeEach(() => {
        alerta = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
        mockToken.mockReset();
        mockVoto.mockReset();
    });
    afterEach(() => alerta.mockRestore());

    const abrir = (onClose = jest.fn()) => {
        renderWithClient(<FeedbackModal visible onClose={onClose} beachName="Praia de Icaraí" beachId="IC001" />);
        return onClose;
    };

    it('só habilita o envio com todos os critérios avaliados', () => {
        abrir();
        expect(screen.getByText('Faltam 5 critérios')).toBeTruthy();
        fireEvent.press(screen.getByText('Enviar'));
        expect(mockToken).not.toHaveBeenCalled();
        avaliarTudo();
        expect(screen.queryByText(/Falta/)).toBeNull();
    });

    it('envia meia estrela e fecha após sucesso', async () => {
        mockToken.mockResolvedValue('tok');
        mockVoto.mockResolvedValue({ votou: false });
        const onClose = abrir();
        avaliarTudo(5);
        await act(async () => fireEvent.press(screen.getByText('Enviar')));
        await waitFor(() => expect(onClose).toHaveBeenCalled());
        expect(mockVoto).toHaveBeenCalledWith(
            'IC001',
            { limpeza: 3.5, acessibilidade: 3.5, infraestrutura: 3.5, seguranca: 3.5, tranquilidade: 3.5 },
            'tok',
        );
        expect(alerta).toHaveBeenCalledWith('Obrigado! 🌊', expect.any(String));
    });

    it('login cancelado não envia nem mostra erro', async () => {
        mockToken.mockResolvedValue(null);
        const onClose = abrir();
        avaliarTudo();
        await act(async () => fireEvent.press(screen.getByText('Enviar')));
        expect(mockVoto).not.toHaveBeenCalled();
        expect(alerta).not.toHaveBeenCalled();
        expect(onClose).not.toHaveBeenCalled();
    });

    it('mostra a mensagem do servidor em caso de erro (ex.: 429)', async () => {
        mockToken.mockResolvedValue('tok');
        mockVoto.mockRejectedValue(axiosError(429, 'Muitas tentativas. Aguarde um minuto.'));
        const onClose = abrir();
        avaliarTudo();
        await act(async () => fireEvent.press(screen.getByText('Enviar')));
        await waitFor(() =>
            expect(alerta).toHaveBeenCalledWith('Não foi possível enviar', 'Muitas tentativas. Aguarde um minuto.'),
        );
        expect(onClose).not.toHaveBeenCalled();
    });

    it('sem internet', async () => {
        mockToken.mockResolvedValue('tok');
        mockVoto.mockRejectedValue(axiosError());
        abrir();
        avaliarTudo();
        await act(async () => fireEvent.press(screen.getByText('Enviar')));
        await waitFor(() => expect(alerta).toHaveBeenCalledWith('Não foi possível enviar', expect.stringMatching(/Sem conexão/)));
    });

    it('avisa quando a avaliação substitui a anterior', async () => {
        mockToken.mockResolvedValue('tok');
        mockVoto.mockResolvedValue({ votou: false, atualizado: true });
        abrir();
        avaliarTudo();
        await act(async () => fireEvent.press(screen.getByText('Enviar')));
        await waitFor(() => expect(alerta).toHaveBeenCalledWith('Avaliação atualizada 🌊', expect.any(String)));
    });
});
