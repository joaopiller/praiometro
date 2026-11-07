import { GoogleSignin } from '@react-native-google-signin/google-signin';

jest.mock('../../config/env', () => ({ env: { googleWebClientId: 'client-id' } }));

const signIn = GoogleSignin.signIn as jest.Mock;

describe('login Google', () => {
    let google: typeof import('../google');

    beforeEach(() => {
        jest.isolateModules(() => {
            google = require('../google');
        });
        google.configureGoogleSignIn();
        signIn.mockReset();
    });

    it('devolve o token em caso de sucesso', async () => {
        signIn.mockResolvedValue({ type: 'success', data: { idToken: 'abc' } });
        await expect(google.obterIdToken()).resolves.toBe('abc');
    });

    it('cancelamento devolve null', async () => {
        signIn.mockResolvedValue({ type: 'cancelled', data: null });
        await expect(google.obterIdToken()).resolves.toBeNull();
    });

    it('erro de cancelamento por código também devolve null', async () => {
        signIn.mockRejectedValue({ code: 'SIGN_IN_CANCELLED' });
        await expect(google.obterIdToken()).resolves.toBeNull();
    });

    it('sem Play Services gera mensagem clara', async () => {
        signIn.mockRejectedValue({ code: 'PLAY_SERVICES_NOT_AVAILABLE' });
        await expect(google.obterIdToken()).rejects.toThrow(/Play Services/);
    });

    it('sucesso sem token é erro', async () => {
        signIn.mockResolvedValue({ type: 'success', data: { idToken: null } });
        await expect(google.obterIdToken()).rejects.toThrow(/token/);
    });
});
