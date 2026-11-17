import { create, isAxiosError, type AxiosError } from 'axios';
import { esquecerToken } from '../auth/sessao';
import { env } from '../config/env';

export const api = create({
    baseURL: env.apiUrl,
    // as consultas desistem cedo e tentam de novo (ver queryClient)
    timeout: 8_000,
});

// envios não se repetem sozinhos, então esperam o servidor voltar do repouso
export const ESPERA_DE_ENVIO = 45_000;

// login recusado pelo servidor: o token guardado não serve mais
api.interceptors.response.use(undefined, (error) => {
    if (isAxiosError(error) && error.response?.status === 401) esquecerToken();
    return Promise.reject(error);
});

export function getErrorMessage(error: unknown): string {
    if (isAxiosError(error)) {
        const err = error as AxiosError<{ detail?: unknown }>;
        const detail = err.response?.data?.detail;
        if (typeof detail === 'string') return detail;
        if (err.code === 'ECONNABORTED') return 'O servidor não respondeu. Verifique sua conexão e tente de novo.';
        if (!err.response) return 'Sem conexão com o servidor. Verifique sua internet.';
        if (err.response.status >= 500) return 'O servidor está com problemas. Tente mais tarde.';
    }
    return 'Algo deu errado. Tente novamente.';
}
