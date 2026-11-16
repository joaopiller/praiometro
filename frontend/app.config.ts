import { withEntitlementsPlist } from 'expo/config-plugins';
import type { ConfigContext, ExpoConfig } from 'expo/config';

/**
 * Variáveis (arquivo .env ou segredos do EAS):
 *   EXPO_PUBLIC_API_URL               URL da API (ex.: http://192.168.0.10:8000)
 *   EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID  Web Client ID do Google Sign-In
 *   EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID  ID do cliente iOS do Google (só para builds iOS)
 *   EXPO_PUBLIC_LOGIN_APPLE=false     tira o login da Apple (conta Apple gratuita não assina apps com ele)
 *   EAS_PROJECT_ID                    (opcional) ID do projeto no Expo/EAS
 */
// o Expo aplica o plugin da Apple só por o pacote estar instalado; sem o login, a permissão sai
const semLoginApple = (config: ExpoConfig) =>
    withEntitlementsPlist(config, (cfg) => {
        delete cfg.modResults['com.apple.developer.applesignin'];
        return cfg;
    });

export default ({ config }: ConfigContext): ExpoConfig => {
    const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? '';
    // HTTP sem TLS só em desenvolvimento, quando a API está na rede local
    const apiSemTls = apiUrl === '' || apiUrl.startsWith('http://');
    // login e localização não podem sair do aparelho sem criptografia
    if (process.env.EAS_BUILD_PROFILE === 'production' && !apiUrl.startsWith('https://')) {
        throw new Error('EXPO_PUBLIC_API_URL precisa começar com https:// no build de produção.');
    }
    // o Google no iOS volta para o app pelo ID do cliente invertido
    const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
    const comApple = process.env.EXPO_PUBLIC_LOGIN_APPLE !== 'false';
    const iosUrlScheme = iosClientId && `com.googleusercontent.apps.${iosClientId.replace('.apps.googleusercontent.com', '')}`;

    const app: ExpoConfig = {
        ...config,
        name: 'Praiômetro',
        slug: 'praiometro',
        version: '2.0.0',
        orientation: 'portrait',
        icon: './assets/images/icone.png',
        userInterfaceStyle: 'light',
        ios: {
            supportsTablet: true,
            bundleIdentifier: 'com.praiometro.app',
            usesAppleSignIn: comApple,
            infoPlist: {
                // nome mostrado pelo sistema em alertas (ex.: login); sem isso aparece "Praimetro"
                CFBundleName: 'Praiômetro',
                // o app só usa a criptografia padrão do sistema (HTTPS)
                ITSAppUsesNonExemptEncryption: false,
                ...(apiSemTls ? { NSAppTransportSecurity: { NSAllowsArbitraryLoads: true } } : {}),
            },
        },
        android: {
            package: 'com.praiometro.app',
            adaptiveIcon: {
                foregroundImage: './assets/images/icone-adaptativo.png',
                // ícones temáticos do Android 13+
                monochromeImage: './assets/images/icone-monocromatico.png',
                backgroundColor: '#015486',
            },
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
                    // a mesma logo vertical da abertura animada, na mesma largura, para a troca não dar salto;
                    // no Android 12+ a imagem é cortada em círculo, e a vertical cabe nele
                    image: './assets/images/logo-abertura.png',
                    imageWidth: 170,
                    resizeMode: 'contain',
                    backgroundColor: '#015486',
                },
            ],
            '@maplibre/maplibre-react-native',
            [
                'expo-location',
                {
                    locationWhenInUsePermission:
                        'O Praiômetro usa sua localização para abrir o app na sua cidade, mostrar a praia mais próxima e confirmar que você está na praia ao enviar um relato.',
                    // o app só usa a localização com ele aberto, e não lê movimento
                    locationAlwaysAndWhenInUsePermission: false,
                    locationAlwaysPermission: false,
                    motionUsagePermission: false,
                    isIosBackgroundLocationEnabled: false,
                    isAndroidBackgroundLocationEnabled: false,
                },
            ],
            [
                'expo-build-properties',
                // HTTP sem TLS só é liberado quando a API configurada é http:// (ex.: rede local).
                { android: { usesCleartextTraffic: apiSemTls } },
            ],
            ...(comApple ? ['expo-apple-authentication'] : []),
            ...(iosUrlScheme ? [['@react-native-google-signin/google-signin', { iosUrlScheme }] as [string, object]] : []),
        ],
        extra: {
            ...config.extra,
            ...(process.env.EAS_PROJECT_ID ? { eas: { projectId: process.env.EAS_PROJECT_ID } } : {}),
        },
    };
    return comApple ? app : semLoginApple(app);
};
