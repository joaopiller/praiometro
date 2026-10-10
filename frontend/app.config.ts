import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Variáveis (arquivo .env ou segredos do EAS):
 *   EXPO_PUBLIC_API_URL               URL da API (ex.: http://192.168.0.10:8000)
 *   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID  Web Client ID do Google Sign-In
 *   GOOGLE_IOS_URL_SCHEME             (opcional) necessário apenas para builds iOS
 *   EAS_PROJECT_ID                    (opcional) ID do projeto no Expo/EAS
 */
export default ({ config }: ConfigContext): ExpoConfig => {
    const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? '';
    const iosUrlScheme = process.env.GOOGLE_IOS_URL_SCHEME;

    return {
        ...config,
        name: 'Praiômetro',
        slug: 'praiometro',
        version: '2.0.0',
        orientation: 'portrait',
        icon: './assets/logo.jpg',
        userInterfaceStyle: 'light',
        newArchEnabled: true,
        splash: { image: './assets/logo.jpg', resizeMode: 'contain', backgroundColor: '#015486' },
        ios: { supportsTablet: true, bundleIdentifier: 'com.praiometro.app' },
        android: {
            package: 'com.praiometro.app',
            adaptiveIcon: { foregroundImage: './assets/logo.jpg', backgroundColor: '#015486' },
            edgeToEdgeEnabled: true,
            // O app não precisa de localização, armazenamento nem sobreposição de tela.
            blockedPermissions: [
                'android.permission.SYSTEM_ALERT_WINDOW',
                'android.permission.READ_EXTERNAL_STORAGE',
                'android.permission.WRITE_EXTERNAL_STORAGE',
            ],
        },
        plugins: [
            '@maplibre/maplibre-react-native',
            [
                'expo-location',
                { locationWhenInUsePermission: 'O Praiômetro usa sua localização para mostrar a praia mais próxima.' },
            ],
            [
                'expo-build-properties',
                // HTTP sem TLS só é liberado quando a API configurada é http:// (ex.: rede local).
                { android: { usesCleartextTraffic: apiUrl === '' || apiUrl.startsWith('http://') } },
            ],
            ...(iosUrlScheme ? [['@react-native-google-signin/google-signin', { iosUrlScheme }] as [string, object]] : []),
        ],
        extra: {
            ...config.extra,
            ...(process.env.EAS_PROJECT_ID ? { eas: { projectId: process.env.EAS_PROJECT_ID } } : {}),
        },
    };
};
