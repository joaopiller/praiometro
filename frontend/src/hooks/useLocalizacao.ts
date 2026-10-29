import * as Location from 'expo-location';
import { useCallback, useState } from 'react';
import type { Coordenada } from '../utils/geo';

export class LocalizacaoError extends Error {}

export async function obterLocalizacao(): Promise<Coordenada> {
    const { status, canAskAgain } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
        throw new LocalizacaoError(
            canAskAgain
                ? 'Permita o acesso à localização para encontrar a praia mais próxima.'
                : 'A localização está bloqueada para o Praiômetro. Libere nas configurações do aparelho.',
        );
    }
    if (!(await Location.hasServicesEnabledAsync())) {
        throw new LocalizacaoError('Ative a localização do aparelho para encontrar a praia mais próxima.');
    }
    // a última posição conhecida responde na hora; serve bem para achar a praia mais perto
    const recente = await Location.getLastKnownPositionAsync({ maxAge: 5 * 60 * 1000 });
    const posicao =
        recente ??
        (await Promise.race([
            Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }),
            new Promise<never>((_, rejeitar) =>
                setTimeout(() => rejeitar(new LocalizacaoError('Não foi possível obter sua localização.')), 15_000),
            ),
        ]));
    return { latitude: posicao.coords.latitude, longitude: posicao.coords.longitude };
}

export function useLocalizacao() {
    const [coordenada, setCoordenada] = useState<Coordenada | null>(null);
    const [carregando, setCarregando] = useState(false);
    const [erro, setErro] = useState<string | null>(null);

    const localizar = useCallback(async (): Promise<{ coordenada: Coordenada } | { erro: string }> => {
        setCarregando(true);
        setErro(null);
        try {
            const c = await obterLocalizacao();
            setCoordenada(c);
            return { coordenada: c };
        } catch (e) {
            const mensagem = e instanceof LocalizacaoError ? e.message : 'Não foi possível obter sua localização.';
            setErro(mensagem);
            return { erro: mensagem };
        } finally {
            setCarregando(false);
        }
    }, []);

    return { coordenada, carregando, erro, localizar };
}
