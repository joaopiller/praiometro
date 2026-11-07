import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react-native';
import type { ReactElement } from 'react';

export function renderWithClient(ui: ReactElement) {
    const client = new QueryClient({
        defaultOptions: { queries: { retry: false, gcTime: Infinity }, mutations: { retry: false, gcTime: Infinity } },
    });
    return { client, ...render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>) };
}

export function axiosError(status?: number, detail?: unknown, code?: string) {
    return Object.assign(new Error('axios'), {
        isAxiosError: true,
        code,
        response: status ? { status, data: detail === undefined ? {} : { detail } } : undefined,
    });
}
