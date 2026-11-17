import { api, ESPERA_DE_ENVIO } from './client';
import type {
    Avaliacao,
    Historico,
    ListaRelatos,
    Notas,
    PontoDetalhe,
    PraiaDetalhe,
    PraiaResumo,
    Regiao,
    RespostaVoto,
    TipoRelato,
} from './types';

export async function fetchPraias(): Promise<PraiaResumo[]> {
    const { data } = await api.get<{ praias: PraiaResumo[] }>('/praias');
    return data.praias;
}

export async function fetchPraia(id: string): Promise<PraiaDetalhe> {
    const { data } = await api.get<PraiaDetalhe>(`/praias/${encodeURIComponent(id)}`);
    return data;
}

export async function fetchPonto(codigo: string): Promise<PontoDetalhe> {
    const { data } = await api.get<PontoDetalhe>(`/pontos/${encodeURIComponent(codigo)}`);
    return data;
}

export async function fetchAvaliacao(praiaId: string): Promise<Avaliacao> {
    const { data } = await api.get<Avaliacao>(`/praias/${encodeURIComponent(praiaId)}/avaliacao`);
    return data;
}

export async function enviarVoto(praiaId: string, notas: Notas, idToken: string): Promise<RespostaVoto> {
    const { data } = await api.post<RespostaVoto>('/votar', notas, {
        params: { praia_id: praiaId },
        headers: { Authorization: `Bearer ${idToken}` },
        timeout: ESPERA_DE_ENVIO,
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

export async function fetchRelatos(praiaId: string): Promise<ListaRelatos> {
    const { data } = await api.get<ListaRelatos>(`/praias/${encodeURIComponent(praiaId)}/relatos`);
    return data;
}

export async function enviarRelato(
    praiaId: string,
    tipos: TipoRelato[],
    local: { latitude: number; longitude: number },
    idToken: string,
): Promise<void> {
    await api.post(
        `/praias/${encodeURIComponent(praiaId)}/relatos`,
        { tipos, latitude: local.latitude, longitude: local.longitude },
        { headers: { Authorization: `Bearer ${idToken}` }, timeout: ESPERA_DE_ENVIO },
    );
}

export async function denunciarRelato(praiaId: string, tipo: TipoRelato, idToken: string): Promise<void> {
    await api.post(`/praias/${encodeURIComponent(praiaId)}/relatos/${tipo}/denuncia`, null, {
        headers: { Authorization: `Bearer ${idToken}` },
        timeout: ESPERA_DE_ENVIO,
    });
}
