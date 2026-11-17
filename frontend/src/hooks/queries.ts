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
import { isStale, maisRecente } from '../utils/format';
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

const A_CADA = 10 * 60 * 1000;
const LOGO = 30 * 1000;

// com o app aberto os dados se renovam sozinhos (as abas ficam montadas, então trocar de aba não
// recarrega nada). Depois de uma falha, ou com a leitura atrasada (servidor recém-iniciado, ainda
// coletando), confere de novo logo
const proximaConsulta = (falhou: boolean, leitura?: string | null) => (falhou || isStale(leitura, 2) ? LOGO : A_CADA);

export function usePraias() {
    return useQuery({
        queryKey: queryKeys.praias,
        queryFn: fetchPraias,
        refetchInterval: ({ state }) =>
            proximaConsulta(state.status === 'error', maisRecente(state.data?.map((p) => p.ultima_leitura))),
    });
}

export function usePraia(id: string) {
    return useQuery({
        queryKey: queryKeys.praia(id),
        queryFn: () => fetchPraia(id),
        refetchInterval: ({ state }) => proximaConsulta(state.status === 'error', state.data?.leitura_atual?.timestamp),
    });
}

export function usePonto(codigo: string) {
    return useQuery({
        queryKey: queryKeys.ponto(codigo),
        queryFn: () => fetchPonto(codigo),
        refetchInterval: ({ state }) => proximaConsulta(state.status === 'error', state.data?.leitura_atual?.timestamp),
    });
}

export function useClima(zona: ZonaClima) {
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
        // histórico vazio é sinal de servidor recém-iniciado: não vale guardar
        staleTime: (consulta) => (consulta.state.data?.total ? 6 * 60 * 60 * 1000 : 0),
        enabled: !!codigo,
    });
}

export function useRegiao() {
    return useQuery({
        queryKey: queryKeys.regiao,
        queryFn: fetchRegiao,
        refetchInterval: ({ state }) => (state.status !== 'error' && state.data?.mare ? A_CADA : LOGO),
    });
}

export function useRelatos(codigo: string) {
    return useQuery({
        queryKey: queryKeys.relatos(codigo),
        queryFn: () => fetchRelatos(codigo),
        staleTime: 60 * 1000,
        refetchInterval: 2 * 60 * 1000,
    });
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
