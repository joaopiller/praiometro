import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useSyncExternalStore } from 'react';
import { obterTokenApple } from './apple';
import { obterIdToken, renovarIdToken, sairDoGoogle } from './google';

export type Provedor = 'google' | 'apple';

// Quem já entrou não precisa entrar de novo a cada avaliação ou relato.
// O token fica só na memória; o que renova o login do Google sem abrir nada é o próprio
// SDK, com o que ele guarda no cofre do sistema. No aparelho o app grava apenas com qual
// conta a pessoa entrou.
const CHAVE = 'praiometro-conta';
// um token perto de vencer poderia expirar no caminho até o servidor
const FOLGA_MS = 2 * 60 * 1000;
const SEM_VALIDADE_MS = 5 * 60 * 1000;

let provedor: Provedor | null = null;
let token: { valor: string; expira: number } | null = null;
let carregando: Promise<void> | null = null;
const ouvintes = new Set<() => void>();

const avisar = () => ouvintes.forEach((o) => o());

function carregar(): Promise<void> {
    carregando ??= AsyncStorage.getItem(CHAVE)
        .then((salvo) => {
            if (!provedor && (salvo === 'google' || salvo === 'apple')) {
                provedor = salvo;
                avisar();
            }
        })
        .catch(() => {});
    return carregando;
}

/** Quando o token vence, pelo `exp` dele. */
function validade(jwt: string): number {
    try {
        const corpo = jwt.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        const { exp } = JSON.parse(atob(corpo)) as { exp?: number };
        if (typeof exp === 'number') return exp * 1000;
    } catch {
        // token que não dá para ler vale por pouco tempo
    }
    return Date.now() + SEM_VALIDADE_MS + FOLGA_MS;
}

function guardar(valor: string, de: Provedor): string {
    token = { valor, expira: validade(valor) };
    if (provedor !== de) {
        provedor = de;
        AsyncStorage.setItem(CHAVE, de).catch(() => {});
        avisar();
    }
    return valor;
}

/** Token de quem já entrou, sem abrir nenhuma tela. Null quando é preciso entrar. */
export async function tokenDaSessao(): Promise<string | null> {
    await carregar();
    if (token && token.expira - Date.now() > FOLGA_MS) return token.valor;
    token = null;
    if (provedor !== 'google') return null;
    const renovado = await renovarIdToken();
    return renovado ? guardar(renovado, 'google') : null;
}

/** Conta usada da última vez, para pular a escolha entre Apple e Google. */
export async function contaLembrada(): Promise<Provedor | null> {
    await carregar();
    return provedor;
}

/** Abre o login da conta escolhida. Null se a pessoa cancelar. */
export async function entrar(com: Provedor): Promise<string | null> {
    const valor = await (com === 'apple' ? obterTokenApple() : obterIdToken());
    return valor ? guardar(valor, com) : null;
}

/** O servidor recusou o token: da próxima vez pede um novo. */
export function esquecerToken() {
    token = null;
}

export async function sair() {
    const era = provedor;
    token = null;
    provedor = null;
    avisar();
    await AsyncStorage.removeItem(CHAVE).catch(() => {});
    if (era === 'google') await sairDoGoogle();
}

/** Conta com que a pessoa entrou (null se não entrou). */
export function useConta(): Provedor | null {
    useEffect(() => {
        carregar();
    }, []);
    return useSyncExternalStore(
        (ouvinte) => {
            ouvintes.add(ouvinte);
            return () => ouvintes.delete(ouvinte);
        },
        () => provedor,
    );
}
