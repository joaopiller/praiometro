import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react-native';
import type { ReactElement } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AvisoProvider } from '../components/Aviso';

const METRICAS = { frame: { x: 0, y: 0, width: 390, height: 844 }, insets: { top: 0, left: 0, right: 0, bottom: 0 } };

export function renderWithClient(ui: ReactElement) {
    const client = new QueryClient({
        defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false, gcTime: Infinity } },
    });
    return {
        client,
        ...render(
            <SafeAreaProvider initialMetrics={METRICAS}>
                <QueryClientProvider client={client}>
                    <AvisoProvider>{ui}</AvisoProvider>
                </QueryClientProvider>
            </SafeAreaProvider>,
        ),
    };
}

export function axiosError(status?: number, detail?: unknown, code?: string) {
    return Object.assign(new Error('axios'), {
        isAxiosError: true,
        code,
        response: status ? { status, data: detail === undefined ? {} : { detail } } : undefined,
    });
}
