import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useSyncExternalStore } from 'react';
import { ZONAS_CLIMA, type ZonaClima } from '../config/env';

const CHAVE = 'praiometro-zona-clima';
let atual: ZonaClima = 'centro';
let carregado = false;
const ouvintes = new Set<() => void>();

function definir(zona: ZonaClima) {
    atual = zona;
    ouvintes.forEach((o) => o());
    AsyncStorage.setItem(CHAVE, zona).catch(() => {});
}

/** Zona do clima escolhida pelo usuário, compartilhada entre as telas e salva no aparelho. */
export function useZonaClima() {
    const zona = useSyncExternalStore(
        (ouvinte) => {
            ouvintes.add(ouvinte);
            return () => ouvintes.delete(ouvinte);
        },
        () => atual,
    );

    useEffect(() => {
        if (carregado) return;
        carregado = true;
        AsyncStorage.getItem(CHAVE)
            .then((salva) => {
                if (salva && ZONAS_CLIMA.some((z) => z.id === salva) && salva !== atual) {
                    atual = salva as ZonaClima;
                    ouvintes.forEach((o) => o());
                }
            })
            .catch(() => {});
    }, []);

    return [zona, definir] as const;
}
