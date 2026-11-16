import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

jest.mock('@react-native-google-signin/google-signin', () => ({
    GoogleSignin: {
        configure: jest.fn(),
        hasPlayServices: jest.fn().mockResolvedValue(true),
        signIn: jest.fn(),
        hasPreviousSignIn: jest.fn(() => false),
        signInSilently: jest.fn(),
        signOut: jest.fn().mockResolvedValue(null),
    },
    isSuccessResponse: (r: { type?: string }) => r?.type === 'success',
    isErrorWithCode: (e: unknown) => typeof e === 'object' && e !== null && 'code' in e,
    statusCodes: { SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED', IN_PROGRESS: 'IN_PROGRESS', PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE' },
}));

jest.mock('@maplibre/maplibre-react-native', () => {
    const React = require('react');
    const { View } = require('react-native');
    const Mock = ({ children }: { children?: React.ReactNode }) => React.createElement(View, null, children);
    return { Map: Mock, Camera: Mock, GeoJSONSource: Mock, Layer: Mock, Images: Mock, UserLocation: Mock };
});

jest.mock('expo-location', () => ({
    getForegroundPermissionsAsync: jest.fn().mockResolvedValue({ granted: false, status: 'undetermined', canAskAgain: true }),
    requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ granted: true, status: 'granted', canAskAgain: true }),
    hasServicesEnabledAsync: jest.fn().mockResolvedValue(true),
    getLastKnownPositionAsync: jest.fn().mockResolvedValue({ coords: { latitude: -22.905, longitude: -43.11 } }),
    getCurrentPositionAsync: jest.fn(),
    Accuracy: { Balanced: 3 },
}));

jest.mock('expo-apple-authentication', () => {
    const { Pressable, Text } = require('react-native');
    const React = require('react');
    return {
        isAvailableAsync: jest.fn().mockResolvedValue(false),
        signInAsync: jest.fn(),
        AppleAuthenticationButtonType: { CONTINUE: 1 },
        AppleAuthenticationButtonStyle: { BLACK: 2 },
        AppleAuthenticationButton: ({ onPress }: { onPress: () => void }) =>
            React.createElement(Pressable, { onPress, testID: 'botao-apple' }, React.createElement(Text, null, 'Continuar com a Apple')),
    };
});

jest.mock('expo-splash-screen', () => ({
    preventAutoHideAsync: jest.fn().mockResolvedValue(true),
    hideAsync: jest.fn().mockResolvedValue(true),
}));

jest.mock('expo-font', () => ({
    ...jest.requireActual('expo-font'),
    isLoaded: jest.fn(() => true),
    loadAsync: jest.fn(() => Promise.resolve()),
}));

// a sessão de login fica na memória do módulo: cada teste começa sem ninguém conectado
afterEach(async () => {
    await require('./src/auth/sessao').sair();
});
