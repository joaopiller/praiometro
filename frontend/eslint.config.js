// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
    expoConfig,
    {
        files: ['**/__tests__/**', 'jest.setup.ts'],
        rules: { '@typescript-eslint/no-require-imports': 'off' },
    },
    {
        ignores: ['dist/*', 'android/*', 'ios/*', 'coverage/*'],
    },
]);
