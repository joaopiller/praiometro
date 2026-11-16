import { act, renderHook } from '@testing-library/react-native';
import { usePuxarParaAtualizar } from '../usePuxarParaAtualizar';

describe('usePuxarParaAtualizar', () => {
    it('mostra a roleta só enquanto a atualização pedida roda', async () => {
        let terminar = () => {};
        const atualizar = jest.fn(() => new Promise<void>((r) => (terminar = r)));
        const { result } = renderHook(() => usePuxarParaAtualizar(atualizar));
        expect(result.current[0]).toBe(false);

        let puxada: Promise<void>;
        act(() => {
            puxada = result.current[1]();
        });
        expect(result.current[0]).toBe(true);

        await act(async () => {
            terminar();
            await puxada;
        });
        expect(result.current[0]).toBe(false);
        expect(atualizar).toHaveBeenCalledTimes(1);
    });

    it('solta a roleta mesmo se a atualização falhar', async () => {
        const { result } = renderHook(() => usePuxarParaAtualizar(() => Promise.reject(new Error('sem rede'))));
        await act(async () => {
            await result.current[1]().catch(() => {});
        });
        expect(result.current[0]).toBe(false);
    });
});
