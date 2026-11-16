import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import * as Location from 'expo-location';
import { denunciarRelato, enviarRelato, fetchRelatos } from '../../api/praiometro';
import { obterIdToken } from '../../auth/google';
import { axiosError, renderWithClient } from '../../test/render';
import RelatosCard from '../RelatosCard';

jest.mock('../../api/praiometro');
jest.mock('../../auth/google', () => ({ ...jest.requireActual('../../auth/google'), obterIdToken: jest.fn() }));

const mockFetch = fetchRelatos as jest.Mock;
const mockEnviar = enviarRelato as jest.Mock;
const mockDenunciar = denunciarRelato as jest.Mock;
const mockToken = obterIdToken as jest.Mock;

const agoraMenos = (min: number) => new Date(Date.now() - min * 60_000).toISOString();

describe('RelatosCard', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockToken.mockResolvedValue('tok');
        mockEnviar.mockResolvedValue(undefined);
        mockDenunciar.mockResolvedValue(undefined);
    });

    it('lista relatos com quantidade de pessoas e tempo', async () => {
        mockFetch.mockResolvedValue({
            disponivel: true,
            relatos: [
                { tipo: 'lotada', rotulo: 'Lotada', confirmacoes: 3, ultimo_em: agoraMenos(20) },
                { tipo: 'agua_viva', rotulo: 'Água-viva', confirmacoes: 1, ultimo_em: agoraMenos(90) },
            ],
        });
        renderWithClient(<RelatosCard codigo="IC001" />);
        expect(await screen.findByText('Lotada')).toBeTruthy();
        expect(screen.getByText('3 pessoas · há 20 min')).toBeTruthy();
        expect(screen.getByText('1 pessoa · há 1 h')).toBeTruthy();
    });

    it('estado vazio', async () => {
        mockFetch.mockResolvedValue({ disponivel: true, relatos: [] });
        renderWithClient(<RelatosCard codigo="IC001" />);
        expect(await screen.findByText('Ninguém relatou nada nas últimas horas.')).toBeTruthy();
    });

    it('some quando o serviço de relatos está fora do ar', async () => {
        mockFetch.mockResolvedValue({ disponivel: false, relatos: [] });
        renderWithClient(<RelatosCard codigo="IC001" />);
        await waitFor(() => expect(mockFetch).toHaveBeenCalled());
        expect(screen.queryByText('AGORA NA PRAIA')).toBeNull();
        expect(screen.queryByText('Como está a praia agora?')).toBeNull();
    });

    it('envia um relato com a localização do usuário', async () => {
        mockFetch.mockResolvedValue({ disponivel: true, relatos: [] });
        renderWithClient(<RelatosCard codigo="IC" />);
        fireEvent.press(await screen.findByText('Como está a praia agora?'));
        // nada marcado: não dá para enviar
        expect(screen.getByRole('button', { name: 'Enviar relato' })).toBeDisabled();
        fireEvent.press(screen.getByText('Água-viva'));
        await act(async () => fireEvent.press(screen.getByText('Enviar relato')));
        await waitFor(() =>
            expect(mockEnviar).toHaveBeenCalledWith('IC', ['agua_viva'], { latitude: -22.905, longitude: -43.11 }, 'tok'),
        );
        expect(await screen.findByText(/Obrigado! Seu relato ajuda/)).toBeTruthy();
    });

    it('marca várias opções e envia tudo junto', async () => {
        mockFetch.mockResolvedValue({ disponivel: true, relatos: [] });
        renderWithClient(<RelatosCard codigo="IC" />);
        fireEvent.press(await screen.findByText('Como está a praia agora?'));
        fireEvent.press(screen.getByText('Lotada'));
        fireEvent.press(screen.getByText('Água limpa'));
        fireEvent.press(screen.getByText('Lixo na areia'));
        // desmarcar também funciona
        fireEvent.press(screen.getByText('Lixo na areia'));
        await act(async () => fireEvent.press(screen.getByText('Enviar 2 relatos')));
        await waitFor(() => expect(mockEnviar).toHaveBeenCalledWith('IC', ['lotada', 'agua_limpa'], expect.any(Object), 'tok'));
        expect(await screen.findByText(/Seus relatos ajudam/)).toBeTruthy();
    });

    it('marcar uma opção desmarca a oposta', async () => {
        mockFetch.mockResolvedValue({ disponivel: true, relatos: [] });
        renderWithClient(<RelatosCard codigo="IC" />);
        fireEvent.press(await screen.findByText('Como está a praia agora?'));
        fireEvent.press(screen.getByText('Lotada'));
        fireEvent.press(screen.getByText('Tranquila'));
        fireEvent.press(screen.getByText('Água turva'));
        fireEvent.press(screen.getByText('Água limpa'));
        expect(screen.getByRole('checkbox', { name: /Lotada/ })).not.toBeChecked();
        expect(screen.getByRole('checkbox', { name: /Água turva/ })).not.toBeChecked();
        await act(async () => fireEvent.press(screen.getByText('Enviar 2 relatos')));
        await waitFor(() => expect(mockEnviar).toHaveBeenCalledWith('IC', ['tranquila', 'agua_limpa'], expect.any(Object), 'tok'));
    });

    it('longe da praia mostra a mensagem do servidor', async () => {
        mockFetch.mockResolvedValue({ disponivel: true, relatos: [] });
        mockEnviar.mockRejectedValue(axiosError(403, 'Você precisa estar na praia para relatar.'));
        renderWithClient(<RelatosCard codigo="IC" />);
        fireEvent.press(await screen.findByText('Como está a praia agora?'));
        fireEvent.press(screen.getByText('Lotada'));
        await act(async () => fireEvent.press(screen.getByText('Enviar relato')));
        expect(await screen.findByText('Você precisa estar na praia para relatar.')).toBeTruthy();
    });

    it('sem permissão de localização não chega a pedir login', async () => {
        (Location.requestForegroundPermissionsAsync as jest.Mock).mockResolvedValueOnce({ status: 'denied', canAskAgain: true });
        mockFetch.mockResolvedValue({ disponivel: true, relatos: [] });
        renderWithClient(<RelatosCard codigo="IC" />);
        fireEvent.press(await screen.findByText('Como está a praia agora?'));
        fireEvent.press(screen.getByText('Lotada'));
        await act(async () => fireEvent.press(screen.getByText('Enviar relato')));
        expect(await screen.findByText(/Permita o acesso à localização/)).toBeTruthy();
        expect(mockToken).not.toHaveBeenCalled();
        expect(mockEnviar).not.toHaveBeenCalled();
    });

    it('confirma ou contesta um relato existente', async () => {
        mockFetch.mockResolvedValue({
            disponivel: true,
            relatos: [{ tipo: 'bandeira_vermelha', rotulo: 'Bandeira vermelha', confirmacoes: 1, ultimo_em: agoraMenos(5) }],
        });
        renderWithClient(<RelatosCard codigo="GR000" />);
        fireEvent.press(await screen.findByText('Bandeira vermelha'));
        expect(screen.getByText(/Relatado por 1 pessoa/)).toBeTruthy();
        await act(async () => fireEvent.press(screen.getByText('Não é verdade')));
        expect(mockDenunciar).toHaveBeenCalledWith('GR000', 'bandeira_vermelha', 'tok');
        expect(await screen.findByText(/Vamos considerar sua contestação/)).toBeTruthy();

        fireEvent.press(screen.getByText('Bandeira vermelha'));
        await act(async () => fireEvent.press(screen.getByText('Eu também vi')));
        await waitFor(() => expect(mockEnviar).toHaveBeenCalledWith('GR000', ['bandeira_vermelha'], expect.any(Object), 'tok'));
        expect(await screen.findByText(/Sua confirmação foi registrada/)).toBeTruthy();
    });

    it('cancelar o login fecha sem mostrar erro', async () => {
        mockToken.mockResolvedValue(null);
        mockFetch.mockResolvedValue({
            disponivel: true,
            relatos: [{ tipo: 'lotada', rotulo: 'Lotada', confirmacoes: 2, ultimo_em: agoraMenos(5) }],
        });
        renderWithClient(<RelatosCard codigo="GR000" />);
        fireEvent.press(await screen.findByText('Lotada'));
        await act(async () => fireEvent.press(screen.getByText('Eu também vi')));
        expect(mockEnviar).not.toHaveBeenCalled();
        expect(screen.queryByText(/Obrigado|Valeu|Não foi possível/)).toBeNull();
    });
});
