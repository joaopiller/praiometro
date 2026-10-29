import type { ExtremoMare, Regiao } from '../api/types';
import { agoraEmNiteroi } from './format';

const pad = (n: number) => String(n).padStart(2, '0');

function chaveAgora(agora: Date): string {
    const d = agoraEmNiteroi(agora);
    return `${d.ano}-${pad(d.mes)}-${pad(d.dia)}T${pad(d.hora)}:${pad(d.minuto)}`;
}

export interface EstadoMare {
    tendencia: 'enchendo' | 'vazando';
    proxima: ExtremoMare;
    seguinte?: ExtremoMare;
}

export function estadoMare(extremos: ExtremoMare[] | undefined, agora: Date = new Date()): EstadoMare | null {
    if (!extremos?.length) return null;
    const ref = chaveAgora(agora);
    const i = extremos.findIndex((e) => e.hora > ref);
    if (i < 0) return null;
    const proxima = extremos[i];
    return { tendencia: proxima.tipo === 'alta' ? 'enchendo' : 'vazando', proxima, seguinte: extremos[i + 1] };
}

export function solDeHoje(sol: Regiao['sol'] | undefined, agora: Date = new Date()) {
    const hoje = chaveAgora(agora).slice(0, 10);
    return sol?.find((s) => s.data === hoje) ?? null;
}
