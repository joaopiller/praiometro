import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { enviarVoto, fetchAvaliacao, fetchHistorico, fetchPonto, fetchPontos, fetchRegiao } from '../api/praiometro';
import type { Notas } from '../api/types';
import { PONTO_CLIMA } from '../config/env';

export const queryKeys = {
    pontos: ['pontos'] as const,
    ponto: (codigo: string) => ['pontos', codigo] as const,
    avaliacao: (codigo: string) => ['pontos', codigo, 'avaliacao'] as const,
    historico: (codigo: string) => ['pontos', codigo, 'historico'] as const,
    regiao: ['regiao'] as const,
};

export function usePontos() {
    return useQuery({ queryKey: queryKeys.pontos, queryFn: fetchPontos });
}

export function usePonto(codigo: string) {
    return useQuery({ queryKey: queryKeys.ponto(codigo), queryFn: () => fetchPonto(codigo) });
}

export function useClima() {
    return usePonto(PONTO_CLIMA);
}

export function useAvaliacao(codigo: string) {
    return useQuery({ queryKey: queryKeys.avaliacao(codigo), queryFn: () => fetchAvaliacao(codigo) });
}

export function useEnviarVoto(codigo: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ notas, idToken }: { notas: Notas; idToken: string }) => enviarVoto(codigo, notas, idToken),
        onSuccess: (resposta) => {
            if (!resposta.votou) queryClient.invalidateQueries({ queryKey: queryKeys.avaliacao(codigo) });
        },
    });
}

export function useHistorico(codigo: string) {
    return useQuery({ queryKey: queryKeys.historico(codigo), queryFn: () => fetchHistorico(codigo), staleTime: 6 * 60 * 60 * 1000 });
}

export function useRegiao() {
    return useQuery({ queryKey: queryKeys.regiao, queryFn: fetchRegiao });
}
