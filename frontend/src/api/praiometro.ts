import { api } from './client';
import type { Avaliacao, Historico, Notas, PontoDetalhe, PontoResumo, Regiao, RespostaVoto } from './types';

export async function fetchPontos(): Promise<PontoResumo[]> {
    const { data } = await api.get<{ pontos: PontoResumo[] }>('/pontos');
    return data.pontos;
}

export async function fetchPonto(codigo: string): Promise<PontoDetalhe> {
    const { data } = await api.get<PontoDetalhe>(`/pontos/${encodeURIComponent(codigo)}`);
    return data;
}

export async function fetchAvaliacao(codigo: string): Promise<Avaliacao> {
    const { data } = await api.get<Avaliacao>(`/pontos/${encodeURIComponent(codigo)}/avaliacao`);
    return data;
}

export async function enviarVoto(praiaId: string, notas: Notas, idToken: string): Promise<RespostaVoto> {
    const { data } = await api.post<RespostaVoto>('/votar', notas, {
        params: { praia_id: praiaId },
        headers: { Authorization: `Bearer ${idToken}` },
    });
    return data;
}

export async function fetchHistorico(codigo: string): Promise<Historico> {
    const { data } = await api.get<Historico>(`/pontos/${encodeURIComponent(codigo)}/historico`);
    return data;
}

export async function fetchRegiao(): Promise<Regiao> {
    const { data } = await api.get<Regiao>('/regiao');
    return data;
}
