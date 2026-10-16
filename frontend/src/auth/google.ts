import {
    GoogleSignin,
    isErrorWithCode,
    isSuccessResponse,
    statusCodes,
} from '@react-native-google-signin/google-signin';
import { env } from '../config/env';

let configurado = false;

export function configureGoogleSignIn() {
    if (configurado) return;
    if (!env.googleWebClientId) {
        console.warn('EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID não definido: login com Google indisponível.');
        return;
    }
    GoogleSignin.configure({ webClientId: env.googleWebClientId });
    configurado = true;
}

export class LoginError extends Error {}

/** Abre o login do Google. Retorna null se o usuário cancelar. */
export async function obterIdToken(): Promise<string | null> {
    if (!configurado) throw new LoginError('Login com Google não está configurado neste app.');
    try {
        await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
        const resposta = await GoogleSignin.signIn();
        // na v14 o cancelamento não lança erro, vem como { type: 'cancelled' }
        if (!isSuccessResponse(resposta)) return null;
        const token = resposta.data.idToken;
        if (!token) throw new LoginError('Não foi possível obter o token do Google.');
        return token;
    } catch (error) {
        if (error instanceof LoginError) throw error;
        if (isErrorWithCode(error)) {
            if (error.code === statusCodes.SIGN_IN_CANCELLED) return null;
            if (error.code === statusCodes.IN_PROGRESS) throw new LoginError('O login já está em andamento.');
            if (error.code === statusCodes.PLAY_SERVICES_NOT_AVAILABLE) {
                throw new LoginError('Google Play Services indisponível neste aparelho.');
            }
        }
        throw new LoginError('Não foi possível entrar com o Google. Tente novamente.');
    }
}
