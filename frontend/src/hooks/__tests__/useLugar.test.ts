import { act, renderHook } from '@testing-library/react-native';
import type * as ExpoLocation from 'expo-location';
import React from 'react';

const COPACABANA = { latitude: -22.972, longitude: -43.185 };
const BARRA = { latitude: -23.011, longitude: -43.35 };
const ICARAI = { latitude: -22.906, longitude: -43.11 };
const SAO_PAULO = { latitude: -23.55, longitude: -46.63 };

// o estado fica no módulo: cada teste carrega o módulo de novo (com o mesmo React)
let lugar: typeof import('../useLugar');
let Location: typeof ExpoLocation;
beforeEach(() => {
    jest.isolateModules(() => {
        jest.doMock('react', () => React);
        lugar = require('../useLugar');
        Location = require('expo-location');
    });
});

describe('cidade pela localização', () => {
    it('vai para o Rio e para a área do clima mais perto', () => {
        const { result } = renderHook(() => [lugar.useCidade()[0], lugar.useZonaClima()[0]]);
        act(() => lugar.irParaOndeEstou(BARRA));
        expect(result.current).toEqual(['rio', 'barra']);
        act(() => lugar.irParaOndeEstou(COPACABANA));
        expect(result.current).toEqual(['rio', 'zona-sul']);
    });

    it('longe das duas cidades fica onde está', () => {
        const { result } = renderHook(() => lugar.useCidade()[0]);
        act(() => lugar.irParaOndeEstou(SAO_PAULO));
        expect(result.current).toBe('niteroi');
    });

    it('a escolha da pessoa vale mais que a localização, a não ser que ela peça', () => {
        const { result } = renderHook(() => lugar.useCidade()[0]);
        act(() => lugar.escolherCidade('rio'));
        act(() => lugar.irParaOndeEstou(ICARAI));
        expect(result.current).toBe('rio');
        act(() => lugar.irParaOndeEstou(ICARAI, true));
        expect(result.current).toBe('niteroi');
    });

    it('sabe onde a pessoa está mesmo quando ela escolheu outra cidade', () => {
        const { result } = renderHook(() => [lugar.useCidade()[0], lugar.useCidadeDaPessoa()]);
        act(() => lugar.irParaOndeEstou(ICARAI));
        act(() => lugar.escolherCidade('rio'));
        act(() => lugar.irParaOndeEstou(ICARAI));
        expect(result.current).toEqual(['rio', 'niteroi']);
    });

    it('a área do clima é guardada por cidade', () => {
        const { result } = renderHook(() => [lugar.useCidade(), lugar.useZonaClima()] as const);
        act(() => result.current[1][1]('oceanica'));
        act(() => result.current[0][1]('rio'));
        expect(result.current[1][0]).toBe('zona-sul');
        act(() => result.current[0][1]('niteroi'));
        expect(result.current[1][0]).toBe('oceanica');
    });

    it('na abertura pede a localização só uma vez', async () => {
        (Location.getLastKnownPositionAsync as jest.Mock).mockResolvedValue({ coords: COPACABANA });
        const { result } = renderHook(() => lugar.useCidade()[0]);
        await act(() => lugar.abrirNaCidadeDaPessoa());
        expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalledTimes(1);
        expect(result.current).toBe('rio');
        await act(() => lugar.abrirNaCidadeDaPessoa());
        expect(Location.requestForegroundPermissionsAsync).toHaveBeenCalledTimes(1);
    });
});
