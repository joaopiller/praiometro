import mockAsyncStorage from '@react-native-async-storage/async-storage/jest/async-storage-mock';

jest.mock('@react-native-async-storage/async-storage', () => mockAsyncStorage);

jest.mock('@react-native-google-signin/google-signin', () => ({
    GoogleSignin: {
        configure: jest.fn(),
        hasPlayServices: jest.fn().mockResolvedValue(true),
        signIn: jest.fn(),
    },
    isSuccessResponse: (r: { type?: string }) => r?.type === 'success',
    isErrorWithCode: (e: unknown) => typeof e === 'object' && e !== null && 'code' in e,
    statusCodes: { SIGN_IN_CANCELLED: 'SIGN_IN_CANCELLED', IN_PROGRESS: 'IN_PROGRESS', PLAY_SERVICES_NOT_AVAILABLE: 'PLAY_SERVICES_NOT_AVAILABLE' },
}));

jest.mock('@maplibre/maplibre-react-native', () => {
    const React = require('react');
    const { View } = require('react-native');
    const Mock = ({ children }: { children?: React.ReactNode }) => React.createElement(View, null, children);
    return { __esModule: true, default: { setAccessToken: jest.fn(), MapView: Mock, Camera: Mock, PointAnnotation: Mock } };
});

jest.mock('expo-location', () => ({
    requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted', canAskAgain: true }),
    hasServicesEnabledAsync: jest.fn().mockResolvedValue(true),
    getLastKnownPositionAsync: jest.fn().mockResolvedValue({ coords: { latitude: -22.905, longitude: -43.11 } }),
    getCurrentPositionAsync: jest.fn(),
    Accuracy: { Balanced: 3 },
}));

jest.mock('expo-font', () => ({
    ...jest.requireActual('expo-font'),
    isLoaded: jest.fn(() => true),
    loadAsync: jest.fn(() => Promise.resolve()),
}));
