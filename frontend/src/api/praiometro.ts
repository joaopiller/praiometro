import { api } from './client';
import type {
    Avaliacao,
    Historico,
    ListaRelatos,
    Notas,
    PontoDetalhe,
    PontoResumo,
    Regiao,
    RespostaVoto,
    TipoRelato,
} from './types';

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

export async function fetchRelatos(codigo: string): Promise<ListaRelatos> {
    const { data } = await api.get<ListaRelatos>(`/pontos/${encodeURIComponent(codigo)}/relatos`);
    return data;
}

export async function enviarRelato(
    codigo: string,
    tipo: TipoRelato,
    local: { latitude: number; longitude: number },
    idToken: string,
): Promise<void> {
    await api.post(
        `/pontos/${encodeURIComponent(codigo)}/relatos`,
        { tipo, latitude: local.latitude, longitude: local.longitude },
        { headers: { Authorization: `Bearer ${idToken}` } },
    );
}

export async function denunciarRelato(codigo: string, tipo: TipoRelato, idToken: string): Promise<void> {
    await api.post(`/pontos/${encodeURIComponent(codigo)}/relatos/${tipo}/denuncia`, null, {
        headers: { Authorization: `Bearer ${idToken}` },
    });
}
