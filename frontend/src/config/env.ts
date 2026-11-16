import Constants from 'expo-constants';

type Extra = { GOOGLE_CLIENT_ID?: string; apiUrl?: string };
const extra = (Constants.expoConfig?.extra ?? {}) as Extra;

export const env = {
    // 10.0.2.2 = localhost do computador visto pelo emulador Android
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? extra.apiUrl ?? 'http://10.0.2.2:8000',
    googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? extra.GOOGLE_CLIENT_ID,
    googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    appVersion: Constants.expoConfig?.version ?? 'dev',
};

export { ZONAS_CLIMA, type ZonaClima } from './cidades';

export const CONTATO = {
    instagram: 'https://www.instagram.com/praiometronit',
    // TODO: definir o e-mail oficial do projeto
    email: process.env.EXPO_PUBLIC_CONTACT_EMAIL,
};
