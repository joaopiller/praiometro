import * as Location from 'expo-location';
import { useCallback, useState } from 'react';
import type { Coordenada } from '../utils/geo';
import { irParaOndeEstou } from './useLugar';

export class LocalizacaoError extends Error {}

const LIMITE_MS = 15_000;

function comLimite<T>(promessa: Promise<T>, ms: number): Promise<T> {
    let timer: ReturnType<typeof setTimeout>;
    const limite = new Promise<never>((_, rejeitar) => {
        timer = setTimeout(
            () => rejeitar(new LocalizacaoError('Não foi possível obter sua localização. Tente de novo em um lugar aberto.')),
            ms,
        );
    });
    return Promise.race([promessa, limite]).finally(() => clearTimeout(timer));
}

export async function obterLocalizacao(): Promise<Coordenada> {
    // só pede se ainda não tiver: no Android o pedido pode ficar sem resposta quando já foi concedido
    const atual = await Location.getForegroundPermissionsAsync();
    const { status, canAskAgain } = atual.granted ? atual : await Location.requestForegroundPermissionsAsync();
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
    // o limite cobre a busca inteira: em alguns aparelhos até a "última posição" pode não responder
    const posicao = await comLimite(
        (async () => {
            // a última posição conhecida responde na hora; serve bem para achar a praia mais perto
            const recente = await Location.getLastKnownPositionAsync({ maxAge: 5 * 60 * 1000 });
            return (
                recente ??
                // sem a janela do Google pedindo para ligar a "precisão de local"
                (await Location.getCurrentPositionAsync({
                    accuracy: Location.Accuracy.Balanced,
                    mayShowUserSettingsDialog: false,
                }))
            );
        })(),
        LIMITE_MS,
    );
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
            // a lista passa a começar pela cidade onde a pessoa está
            irParaOndeEstou(c);
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
