import AsyncStorage from '@react-native-async-storage/async-storage';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import * as AppleAuthentication from 'expo-apple-authentication';
import { configureGoogleSignIn } from '../google';
import { contaLembrada, entrar, esquecerToken, sair, tokenDaSessao } from '../sessao';

jest.mock('../../config/env', () => ({ env: { googleWebClientId: 'client-id' } }));

const google = GoogleSignin as jest.Mocked<typeof GoogleSignin>;
const apple = AppleAuthentication.signInAsync as jest.Mock;

/** token com o `exp` pedido, do jeito que o Google e a Apple mandam */
const jwt = (expiraEmSegundos: number) =>
    `x.${btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + expiraEmSegundos }))}.y`;
const sucesso = (idToken: string) => ({ type: 'success', data: { idToken } }) as never;

describe('sessão', () => {
    beforeEach(() => {
        jest.clearAllMocks();
        configureGoogleSignIn();
    });

    it('sem ter entrado, não há token nem conta', async () => {
        expect(await tokenDaSessao()).toBeNull();
        expect(await contaLembrada()).toBeNull();
    });

    it('depois de entrar, o token vale sem abrir o login de novo', async () => {
        const token = jwt(3600);
        google.signIn.mockResolvedValueOnce(sucesso(token));
        expect(await entrar('google')).toBe(token);
        expect(await tokenDaSessao()).toBe(token);
        expect(await tokenDaSessao()).toBe(token);
        expect(google.signIn).toHaveBeenCalledTimes(1);
        expect(google.signInSilently).not.toHaveBeenCalled();
        // no aparelho fica só a conta usada, nunca o token
        expect(AsyncStorage.setItem).toHaveBeenCalledWith('praiometro-conta', 'google');
        expect(JSON.stringify((AsyncStorage.setItem as jest.Mock).mock.calls)).not.toContain(token);
    });

    it('token do Google vencido é renovado sem tela', async () => {
        google.signIn.mockResolvedValueOnce(sucesso(jwt(30)));
        await entrar('google');
        const novo = jwt(3600);
        google.hasPreviousSignIn.mockReturnValue(true);
        google.signInSilently.mockResolvedValueOnce(sucesso(novo));
        expect(await tokenDaSessao()).toBe(novo);
    });

    it('quando o Google não renova, é preciso entrar de novo', async () => {
        google.signIn.mockResolvedValueOnce(sucesso(jwt(30)));
        await entrar('google');
        google.hasPreviousSignIn.mockReturnValue(true);
        google.signInSilently.mockResolvedValueOnce({ type: 'noSavedCredentialFound', data: null } as never);
        expect(await tokenDaSessao()).toBeNull();
    });

    it('token da Apple vencido não se renova, mas a conta fica lembrada', async () => {
        apple.mockResolvedValueOnce({ identityToken: jwt(30) });
        await entrar('apple');
        expect(await tokenDaSessao()).toBeNull();
        expect(await contaLembrada()).toBe('apple');
        expect(google.signInSilently).not.toHaveBeenCalled();
    });

    it('token recusado pelo servidor é esquecido', async () => {
        apple.mockResolvedValueOnce({ identityToken: jwt(3600) });
        await entrar('apple');
        esquecerToken();
        expect(await tokenDaSessao()).toBeNull();
    });

    it('login cancelado não cria sessão', async () => {
        google.signIn.mockResolvedValueOnce({ type: 'cancelled', data: null } as never);
        expect(await entrar('google')).toBeNull();
        expect(await contaLembrada()).toBeNull();
    });

    it('sair esquece o token e a conta, e sai do Google', async () => {
        google.signIn.mockResolvedValueOnce(sucesso(jwt(3600)));
        await entrar('google');
        await sair();
        expect(await tokenDaSessao()).toBeNull();
        expect(await contaLembrada()).toBeNull();
        expect(google.signOut).toHaveBeenCalled();
        expect(AsyncStorage.removeItem).toHaveBeenCalledWith('praiometro-conta');
    });
});
