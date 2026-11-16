import { act, renderHook } from '@testing-library/react-native';
import type { LayoutChangeEvent } from 'react-native';
import { useDeslize } from '../useDeslize';

const medida = (x: number, width: number) => ({ nativeEvent: { layout: { x, width, y: 0, height: 30 } } }) as LayoutChangeEvent;

describe('useDeslize', () => {
    it('só tem marcador depois de medir todas as opções', () => {
        const { result } = renderHook(() => useDeslize(0, 2));
        expect(result.current.marcador).toBeNull();
        act(() => result.current.medir(0)(medida(3, 92)));
        expect(result.current.marcador).toBeNull();
        act(() => result.current.medir(1)(medida(95, 140)));
        expect(result.current.marcador).not.toBeNull();
    });

    it('com uma opção só não há o que deslizar', () => {
        const { result } = renderHook(() => useDeslize(0, 1));
        act(() => result.current.medir(0)(medida(0, 80)));
        expect(result.current.marcador).toBeNull();
    });
});
