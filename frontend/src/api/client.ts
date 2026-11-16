import { create, isAxiosError, type AxiosError } from 'axios';
import { env } from '../config/env';

export const api = create({
    baseURL: env.apiUrl,
    timeout: 15_000,
});

export function getErrorMessage(error: unknown): string {
    if (isAxiosError(error)) {
        const err = error as AxiosError<{ detail?: unknown }>;
        const detail = err.response?.data?.detail;
        if (typeof detail === 'string') return detail;
        if (err.code === 'ECONNABORTED') return 'O servidor demorou para responder.';
        if (!err.response) return 'Sem conexão com o servidor. Verifique sua internet.';
        if (err.response.status >= 500) return 'O servidor está com problemas. Tente mais tarde.';
    }
    return 'Algo deu errado. Tente novamente.';
}
