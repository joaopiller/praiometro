import { act, fireEvent, render, screen } from '@testing-library/react-native';
import * as AppleAuthentication from 'expo-apple-authentication';
import { useState } from 'react';
import { Pressable, Text } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { obterIdToken } from '../google';
import { LoginProvider, useLogin } from '../LoginProvider';

jest.mock('../google', () => ({ ...jest.requireActual('../google'), obterIdToken: jest.fn() }));

const mockGoogle = obterIdToken as jest.Mock;
const mockAppleDisponivel = AppleAuthentication.isAvailableAsync as jest.Mock;
const mockApple = AppleAuthentication.signInAsync as jest.Mock;

function Botao() {
    const { pedirLogin } = useLogin();
    const [resultado, setResultado] = useState('nada');
    return (
        <Pressable onPress={async () => setResultado(String(await pedirLogin()))}>
            <Text>entrar</Text>
            <Text>resultado: {resultado}</Text>
        </Pressable>
    );
}

const montar = () =>
    render(
        <SafeAreaProvider initialMetrics={{ frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } }}>
            <LoginProvider>
                <Botao />
            </LoginProvider>
        </SafeAreaProvider>,
    );

describe('LoginProvider', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        mockGoogle.mockResolvedValue('token-google');
        mockApple.mockResolvedValue({ identityToken: 'token-apple' });
    });

    it('sem Apple disponível (Android) vai direto para o Google', async () => {
        mockAppleDisponivel.mockResolvedValue(false);
        montar();
        await act(async () => fireEvent.press(screen.getByText('entrar')));
        expect(await screen.findByText('resultado: token-google')).toBeTruthy();
        expect(screen.queryByText('Entre para continuar')).toBeNull();
    });

    it('no iPhone oferece Apple e Google', async () => {
        mockAppleDisponivel.mockResolvedValue(true);
        montar();
        await act(async () => {});
        fireEvent.press(screen.getByText('entrar'));
        expect(await screen.findByText('Entre para continuar')).toBeTruthy();
        await act(async () => {
            fireEvent.press(screen.getByTestId('botao-apple'));
            await new Promise((r) => setTimeout(r, 400));
        });
        expect(mockApple).toHaveBeenCalledWith({ requestedScopes: [] });
        expect(await screen.findByText('resultado: token-apple')).toBeTruthy();
    });

    it('escolher Google no iPhone', async () => {
        mockAppleDisponivel.mockResolvedValue(true);
        montar();
        await act(async () => {});
        fireEvent.press(screen.getByText('entrar'));
        await act(async () => {
            fireEvent.press(await screen.findByText('Continuar com o Google'));
            await new Promise((r) => setTimeout(r, 400));
        });
        expect(await screen.findByText('resultado: token-google')).toBeTruthy();
    });

    it('"Agora não" cancela sem erro', async () => {
        mockAppleDisponivel.mockResolvedValue(true);
        montar();
        await act(async () => {});
        fireEvent.press(screen.getByText('entrar'));
        await act(async () => fireEvent.press(await screen.findByText('Agora não')));
        expect(await screen.findByText('resultado: null')).toBeTruthy();
        expect(mockGoogle).not.toHaveBeenCalled();
    });

    it('cancelar o login da Apple devolve null', async () => {
        mockAppleDisponivel.mockResolvedValue(true);
        mockApple.mockRejectedValue({ code: 'ERR_REQUEST_CANCELED' });
        montar();
        await act(async () => {});
        fireEvent.press(screen.getByText('entrar'));
        await act(async () => {
            fireEvent.press(await screen.findByTestId('botao-apple'));
            await new Promise((r) => setTimeout(r, 400));
        });
        expect(await screen.findByText('resultado: null')).toBeTruthy();
    });
});
