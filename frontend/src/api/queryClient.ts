import { focusManager, QueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { AppState, Platform, type AppStateStatus } from 'react-native';

export function createQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 5 * 60 * 1000,
                gcTime: 60 * 60 * 1000,
                // quando o servidor não responde, cada tentativa custa o tempo limite inteiro:
                // tentar de novo só dobraria a espera. Outras falhas ganham uma segunda chance
                retry: (falhas, erro) => falhas < 1 && !(isAxiosError(erro) && erro.code === 'ECONNABORTED'),
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
