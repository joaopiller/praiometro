import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react-native';
import type { ReactNode } from 'react';
import { fetchPraias } from '../../api/praiometro';
import { axiosError } from '../../test/render';
import { usePraias } from '../queries';

jest.mock('../../api/praiometro');

const mockPraias = fetchPraias as jest.Mock;
const agora = new Date(Date.now() - 3 * 3_600_000).toISOString().slice(0, 16);

function montar() {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: Infinity } } });
    const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>;
    return renderHook(() => usePraias(), { wrapper });
}

describe('renovação dos dados com o app aberto', () => {
    beforeEach(() => {
        jest.useFakeTimers();
        mockPraias.mockReset();
    });
    afterEach(() => jest.useRealTimers());

    it('com leitura em dia, só consulta de novo depois de 10 minutos', async () => {
        mockPraias.mockResolvedValue([{ id: 'IC', ultima_leitura: agora }]);
        montar();
        await act(() => jest.advanceTimersByTimeAsync(9 * 60_000));
        expect(mockPraias).toHaveBeenCalledTimes(1);
        await act(() => jest.advanceTimersByTimeAsync(60_000));
        expect(mockPraias).toHaveBeenCalledTimes(2);
    });

    it('depois de uma falha, tenta de novo em 30 segundos', async () => {
        mockPraias.mockRejectedValue(axiosError(undefined, undefined, 'ECONNABORTED'));
        montar();
        await act(() => jest.advanceTimersByTimeAsync(1_000));
        expect(mockPraias).toHaveBeenCalledTimes(1);
        await act(() => jest.advanceTimersByTimeAsync(30_000));
        expect(mockPraias).toHaveBeenCalledTimes(2);
    });

    it('servidor que respondeu sem leituras é consultado de novo em 30 segundos', async () => {
        mockPraias.mockResolvedValue([{ id: 'IC', ultima_leitura: null }]);
        montar();
        await act(() => jest.advanceTimersByTimeAsync(31_000));
        expect(mockPraias).toHaveBeenCalledTimes(2);
    });
});
