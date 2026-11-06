import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createQueryClient, setupAppFocusRefetch } from './src/api/queryClient';
import { configureGoogleSignIn } from './src/auth/google';
import ErrorBoundary from './src/components/ErrorBoundary';
import RootNavigator from './src/navigation/RootNavigator';

const persister = createAsyncStoragePersister({ storage: AsyncStorage, key: 'praiometro-cache-v1' });

export default function App() {
    const [queryClient] = useState(createQueryClient);

    useEffect(() => {
        configureGoogleSignIn();
        return setupAppFocusRefetch();
    }, []);

    return (
        <ErrorBoundary>
            <SafeAreaProvider>
                <PersistQueryClientProvider
                    client={queryClient}
                    persistOptions={{ persister, maxAge: 24 * 60 * 60 * 1000, buster: '2' }}
                >
                    <StatusBar style="light" />
                    <RootNavigator />
                </PersistQueryClientProvider>
            </SafeAreaProvider>
        </ErrorBoundary>
    );
}
