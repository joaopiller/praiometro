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

// O modelo de clima (~10 km) enxerga Niterói como duas áreas: a baía/centro e a
// Região Oceânica. Cada uma usa um ponto representativo.
export const ZONAS_CLIMA = [
    { id: 'centro', rotulo: 'Centro e baía', ponto: 'GR000' },
    { id: 'oceanica', rotulo: 'Região Oceânica', ponto: 'PR001' },
] as const;

export type ZonaClima = (typeof ZONAS_CLIMA)[number]['id'];

export const CONTATO = {
    instagram: 'https://www.instagram.com/praiometronit',
    // TODO: definir o e-mail oficial do projeto
    email: process.env.EXPO_PUBLIC_CONTACT_EMAIL,
};
