import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useEffect, useSyncExternalStore } from 'react';
import { CIDADES, ORDEM_CIDADES, ZONAS_CLIMA, type Cidade, type ZonaClima } from '../config/cidades';
import { distanciaKm, type Coordenada } from '../utils/geo';

// Cidade e área do clima, compartilhadas entre as telas e salvas no aparelho.
// Começam pela localização da pessoa; depois que ela escolhe na mão, a escolha vale.

interface Lugar {
    /** cidade mostrada no mapa e no clima */
    cidade: Cidade;
    zonas: Record<Cidade, ZonaClima>;
    /** cidade onde a pessoa está, pela localização (null quando não se sabe) */
    ondeEsta: Cidade | null;
}

const CHAVE = 'praiometro-lugar';
const CHAVE_PEDIU = 'praiometro-pediu-localizacao';
// longe disso das praias, a pessoa não está em nenhuma das cidades
const ALCANCE_KM = 40;

let atual: Lugar = { cidade: 'niteroi', zonas: { niteroi: 'centro', rio: 'zona-sul' }, ondeEsta: null };
let escolhaManual = false;
let carregado = false;
const ouvintes = new Set<() => void>();

function publicar(novo: Lugar) {
    atual = novo;
    ouvintes.forEach((o) => o());
    AsyncStorage.setItem(CHAVE, JSON.stringify(novo)).catch(() => {});
}

function carregar() {
    if (carregado) return;
    carregado = true;
    AsyncStorage.getItem(CHAVE)
        .then((salvo) => {
            const lugar = salvo ? (JSON.parse(salvo) as Partial<Lugar>) : null;
            if (lugar?.cidade && ORDEM_CIDADES.includes(lugar.cidade) && !escolhaManual) {
                atual = { ...atual, cidade: lugar.cidade, zonas: { ...atual.zonas, ...lugar.zonas } };
                ouvintes.forEach((o) => o());
            }
        })
        .catch(() => {});
}

function useLugar() {
    useEffect(carregar, []);
    return useSyncExternalStore(
        (ouvinte) => {
            ouvintes.add(ouvinte);
            return () => ouvintes.delete(ouvinte);
        },
        () => atual,
    );
}

export function escolherCidade(cidade: Cidade) {
    escolhaManual = true;
    if (cidade !== atual.cidade) publicar({ ...atual, cidade });
}

export function useCidade() {
    return [useLugar().cidade, escolherCidade] as const;
}

/** Área do clima dentro da cidade atual. */
export function useZonaClima() {
    const lugar = useLugar();
    const definir = (zona: ZonaClima) => {
        const cidade = ZONAS_CLIMA.find((z) => z.id === zona)!.cidade;
        publicar({ ...atual, cidade, zonas: { ...atual.zonas, [cidade]: zona } });
    };
    return [lugar.zonas[lugar.cidade], definir] as const;
}

/** Cidade onde a pessoa está; sem localização, a cidade escolhida. */
export function useCidadeDaPessoa() {
    const lugar = useLugar();
    return lugar.ondeEsta ?? lugar.cidade;
}

const maisPerto = <T,>(itens: readonly T[], lugar: (t: T) => Coordenada[], origem: Coordenada) =>
    itens
        .map((item) => ({ item, km: Math.min(...lugar(item).map((l) => distanciaKm(origem, l))) }))
        .sort((a, b) => a.km - b.km)[0];

/** Põe o app na cidade (e na área do clima) mais perto da pessoa. */
export function irParaOndeEstou(origem: Coordenada, forcar = false) {
    const cidade = maisPerto(ORDEM_CIDADES, (c) => CIDADES[c].referencias, origem);
    if (!cidade || cidade.km > ALCANCE_KM) return;
    if (escolhaManual && !forcar) {
        // a escolha da pessoa continua no mapa; a lista ainda começa por onde ela está
        if (atual.ondeEsta !== cidade.item) publicar({ ...atual, ondeEsta: cidade.item });
        return;
    }
    const zonas = ZONAS_CLIMA.filter((z) => z.cidade === cidade.item);
    const zona = maisPerto(zonas, (z) => [z.lugar], origem)!.item.id;
    publicar({ cidade: cidade.item, zonas: { ...atual.zonas, [cidade.item]: zona }, ondeEsta: cidade.item });
}

/**
 * Na abertura: pede a localização uma vez (só na primeira abertura) e abre o app na
 * cidade da pessoa. Sem permissão, fica na última cidade usada.
 */
export async function abrirNaCidadeDaPessoa() {
    try {
        let permissao = await Location.getForegroundPermissionsAsync();
        if (!permissao.granted && permissao.canAskAgain && !(await AsyncStorage.getItem(CHAVE_PEDIU))) {
            await AsyncStorage.setItem(CHAVE_PEDIU, '1');
            permissao = await Location.requestForegroundPermissionsAsync();
        }
        if (!permissao.granted) return;
        const posicao = await Location.getLastKnownPositionAsync({ maxAge: 30 * 60 * 1000 });
        if (posicao) irParaOndeEstou({ latitude: posicao.coords.latitude, longitude: posicao.coords.longitude });
    } catch {
        // sem localização o app segue na última cidade usada
    }
}
