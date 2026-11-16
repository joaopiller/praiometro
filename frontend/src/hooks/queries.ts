import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
    denunciarRelato,
    enviarRelato,
    enviarVoto,
    fetchAvaliacao,
    fetchHistorico,
    fetchPonto,
    fetchPraia,
    fetchPraias,
    fetchRegiao,
    fetchRelatos,
} from '../api/praiometro';
import type { Notas, TipoRelato } from '../api/types';
import type { Coordenada } from '../utils/geo';
import { ZONAS_CLIMA, type ZonaClima } from '../config/env';

export const queryKeys = {
    praias: ['praias'] as const,
    praia: (id: string) => ['praias', id] as const,
    ponto: (codigo: string) => ['pontos', codigo] as const,
    avaliacao: (praiaId: string) => ['praias', praiaId, 'avaliacao'] as const,
    historico: (codigo: string) => ['pontos', codigo, 'historico'] as const,
    regiao: ['regiao'] as const,
    relatos: (praiaId: string) => ['praias', praiaId, 'relatos'] as const,
};

export function usePraias() {
    return useQuery({ queryKey: queryKeys.praias, queryFn: fetchPraias });
}

export function usePraia(id: string) {
    return useQuery({ queryKey: queryKeys.praia(id), queryFn: () => fetchPraia(id) });
}

export function usePonto(codigo: string) {
    return useQuery({ queryKey: queryKeys.ponto(codigo), queryFn: () => fetchPonto(codigo) });
}

export function useClima(zona: ZonaClima = 'centro') {
    return usePonto(ZONAS_CLIMA.find((z) => z.id === zona)!.ponto);
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
    return useQuery({
        queryKey: queryKeys.historico(codigo),
        queryFn: () => fetchHistorico(codigo),
        staleTime: 6 * 60 * 60 * 1000,
        enabled: !!codigo,
    });
}

export function useRegiao() {
    return useQuery({ queryKey: queryKeys.regiao, queryFn: fetchRegiao });
}

export function useRelatos(codigo: string) {
    return useQuery({ queryKey: queryKeys.relatos(codigo), queryFn: () => fetchRelatos(codigo), staleTime: 60 * 1000 });
}

export function useEnviarRelato(codigo: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ tipos, local, idToken }: { tipos: TipoRelato[]; local: Coordenada; idToken: string }) =>
            enviarRelato(codigo, tipos, local, idToken),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.relatos(codigo) }),
    });
}

export function useDenunciarRelato(codigo: string) {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ tipo, idToken }: { tipo: TipoRelato; idToken: string }) => denunciarRelato(codigo, tipo, idToken),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.relatos(codigo) }),
    });
}
