/** @type {import('jest').Config} */
module.exports = {
    preset: 'jest-expo',
    setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
    moduleNameMapper: {
        '\\.svg$': '<rootDir>/__mocks__/svgMock.js',
    },
    transformIgnorePatterns: [
        'node_modules/(?!((jest-)?react-native|@react-native(-community)?|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@maplibre/.*|@react-native-google-signin/.*|@tanstack/.*|react-native-svg))',
    ],
    collectCoverageFrom: ['src/**/*.{ts,tsx}', '!src/**/styles.ts', '!src/types/**'],
    testPathIgnorePatterns: ['/node_modules/', '/android/', '/ios/'],
};
