import { focusManager, QueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { AppState, Platform, type AppStateStatus } from 'react-native';

// o que foi carregado fica guardado por este tempo: abrir o app sem servidor mostra os últimos dados
export const GUARDAR_POR = 7 * 24 * 60 * 60 * 1000;

// servidor mudo quase sempre está voltando do repouso (até um minuto): vale insistir por esse tempo
const TENTATIVAS_SEM_RESPOSTA = 6;

const semResposta = (erro: unknown) => isAxiosError(erro) && erro.code === 'ECONNABORTED';

export function createQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 5 * 60 * 1000,
                gcTime: GUARDAR_POR,
                retry: (falhas, erro) => falhas < (semResposta(erro) ? TENTATIVAS_SEM_RESPOSTA : 1),
                retryDelay: (tentativa, erro) => (semResposta(erro) ? 1000 : Math.min(1000 * 2 ** tentativa, 30_000)),
            },
        },
    });
}

export function setupAppFocusRefetch() {
    const onChange = (status: AppStateStatus) => {
        if (Platform.OS !== 'web') focusManager.setFocused(status === 'active');
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
}
