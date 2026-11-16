import * as AppleAuthentication from 'expo-apple-authentication';
import { Platform } from 'react-native';
import { LoginError } from './google';

export async function appleDisponivel(): Promise<boolean> {
    if (Platform.OS !== 'ios') return false;
    try {
        return await AppleAuthentication.isAvailableAsync();
    } catch {
        return false;
    }
}

/** Abre o "Entrar com a Apple". Retorna null se o usuário cancelar. */
export async function obterTokenApple(): Promise<string | null> {
    try {
        // sem pedir nome nem e-mail: o identificador basta para evitar votos repetidos
        const credencial = await AppleAuthentication.signInAsync({ requestedScopes: [] });
        if (!credencial.identityToken) throw new LoginError('Não foi possível obter o token da Apple.');
        return credencial.identityToken;
    } catch (error) {
        if (error instanceof LoginError) throw error;
        if ((error as { code?: string })?.code === 'ERR_REQUEST_CANCELED') return null;
        throw new LoginError('Não foi possível entrar com a Apple. Tente novamente.');
    }
}
