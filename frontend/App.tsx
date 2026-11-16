import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { createQueryClient, setupAppFocusRefetch } from './src/api/queryClient';
import { configureGoogleSignIn } from './src/auth/google';
import { LoginProvider } from './src/auth/LoginProvider';
import AnimatedSplash from './src/components/AnimatedSplash';
import { AvisoProvider } from './src/components/Aviso';
import ErrorBoundary from './src/components/ErrorBoundary';
import { abrirNaCidadeDaPessoa } from './src/hooks/useLugar';
import RootNavigator from './src/navigation/RootNavigator';

// a abertura nativa fica até a animada assumir (ela chama hideAsync ao aparecer)
SplashScreen.preventAutoHideAsync().catch(() => {});

const persister = createAsyncStoragePersister({ storage: AsyncStorage, key: 'praiometro-cache-v1' });

export default function App() {
    const [queryClient] = useState(createQueryClient);
    const [cacheRestaurado, setCacheRestaurado] = useState(false);
    const [aberturaConcluida, setAberturaConcluida] = useState(false);

    useEffect(() => {
        configureGoogleSignIn();
        return setupAppFocusRefetch();
    }, []);

    return (
        <ErrorBoundary>
            <SafeAreaProvider>
                <PersistQueryClientProvider
                    client={queryClient}
                    persistOptions={{ persister, maxAge: 24 * 60 * 60 * 1000, buster: '3' }}
                    onSuccess={() => setCacheRestaurado(true)}
                    onError={() => setCacheRestaurado(true)}
                >
                    <StatusBar style="light" />
                    <AvisoProvider>
                        <LoginProvider>
                            <RootNavigator />
                        </LoginProvider>
                    </AvisoProvider>
                    {!aberturaConcluida && (
                        <AnimatedSplash
                            pronto={cacheRestaurado}
                            onFim={() => {
                                setAberturaConcluida(true);
                                // depois da abertura, para o pedido de localização não ficar por cima dela
                                abrirNaCidadeDaPessoa();
                            }}
                        />
                    )}
                </PersistQueryClientProvider>
            </SafeAreaProvider>
        </ErrorBoundary>
    );
}
