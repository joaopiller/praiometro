import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Variáveis (arquivo .env ou segredos do EAS):
 *   EXPO_PUBLIC_API_URL               URL da API (ex.: http://192.168.0.10:8000)
 *   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID  Web Client ID do Google Sign-In
 *   EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID  ID do cliente iOS do Google (só para builds iOS)
 *   EAS_PROJECT_ID                    (opcional) ID do projeto no Expo/EAS
 */
export default ({ config }: ConfigContext): ExpoConfig => {
    const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? '';
    // HTTP sem TLS só em desenvolvimento, quando a API está na rede local
    const apiSemTls = apiUrl === '' || apiUrl.startsWith('http://');
    // o Google no iOS volta para o app pelo ID do cliente invertido
    const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
    const iosUrlScheme = iosClientId && `com.googleusercontent.apps.${iosClientId.replace('.apps.googleusercontent.com', '')}`;

    return {
        ...config,
        name: 'Praiômetro',
        slug: 'praiometro',
        version: '2.0.0',
        orientation: 'portrait',
        icon: './assets/images/icone.png',
        userInterfaceStyle: 'light',
        newArchEnabled: true,
        ios: {
            supportsTablet: true,
            bundleIdentifier: 'com.praiometro.app',
            usesAppleSignIn: true,
            infoPlist: {
                // o app só usa a criptografia padrão do sistema (HTTPS)
                ITSAppUsesNonExemptEncryption: false,
                ...(apiSemTls ? { NSAppTransportSecurity: { NSAllowsArbitraryLoads: true } } : {}),
            },
        },
        android: {
            package: 'com.praiometro.app',
            adaptiveIcon: { foregroundImage: './assets/images/icone-adaptativo.png', backgroundColor: '#015486' },
            edgeToEdgeEnabled: true,
            // O app não precisa de armazenamento nem de sobreposição de tela.
            blockedPermissions: [
                'android.permission.SYSTEM_ALERT_WINDOW',
                'android.permission.READ_EXTERNAL_STORAGE',
                'android.permission.WRITE_EXTERNAL_STORAGE',
            ],
        },
        plugins: [
            [
                'expo-splash-screen',
                {
                    // logo recortada rente ao desenho: no Android 12+ a imagem é cortada em círculo,
                    // então ela precisa ser estreita o bastante para caber nele
                    image: './assets/images/logo-header.png',
                    imageWidth: 170,
                    resizeMode: 'contain',
                    backgroundColor: '#015486',
                },
            ],
            '@maplibre/maplibre-react-native',
            [
                'expo-location',
                { locationWhenInUsePermission: 'O Praiômetro usa sua localização para mostrar a praia mais próxima.' },
            ],
            [
                'expo-build-properties',
                // HTTP sem TLS só é liberado quando a API configurada é http:// (ex.: rede local).
                { android: { usesCleartextTraffic: apiSemTls } },
            ],
            'expo-apple-authentication',
            ...(iosUrlScheme ? [['@react-native-google-signin/google-signin', { iosUrlScheme }] as [string, object]] : []),
        ],
        extra: {
            ...config.extra,
            ...(process.env.EAS_PROJECT_ID ? { eas: { projectId: process.env.EAS_PROJECT_ID } } : {}),
        },
    };
};
