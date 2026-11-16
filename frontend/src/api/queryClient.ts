import { focusManager, QueryClient } from '@tanstack/react-query';
import { AppState, Platform, type AppStateStatus } from 'react-native';

export function createQueryClient() {
    return new QueryClient({
        defaultOptions: {
            queries: {
                staleTime: 5 * 60 * 1000,
                gcTime: 60 * 60 * 1000,
                retry: 1,
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
