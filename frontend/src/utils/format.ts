// Timestamps da API: hora local de Niterói sem fuso ("2026-01-10T14:00")
export interface DataLocal {
    ano: number;
    mes: number;
    dia: number;
    hora: number;
    minuto: number;
}

const pad = (n: number) => String(n).padStart(2, '0');

export function parseTimestamp(timestamp?: string | null): DataLocal | null {
    const m = timestamp?.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
    if (!m) return null;
    const [ano, mes, dia, hora, minuto] = m.slice(1).map(Number);
    return { ano, mes, dia, hora, minuto };
}

export function formatHour(timestamp?: string | null): string {
    const d = parseTimestamp(timestamp);
    return d ? `${pad(d.hora)}:${pad(d.minuto)}` : '--:--';
}

export function formatDate(timestamp?: string | null): string {
    const d = parseTimestamp(timestamp);
    return d ? `${pad(d.dia)}/${pad(d.mes)}` : '--/--';
}

// Niterói = UTC-3 (sem horário de verão desde 2019)
export function agoraEmNiteroi(agora: Date = new Date()): DataLocal {
    const local = new Date(agora.getTime() - 3 * 60 * 60 * 1000);
    return {
        ano: local.getUTCFullYear(),
        mes: local.getUTCMonth() + 1,
        dia: local.getUTCDate(),
        hora: local.getUTCHours(),
        minuto: local.getUTCMinutes(),
    };
}

const paraMinutos = (d: DataLocal) => Date.UTC(d.ano, d.mes - 1, d.dia, d.hora, d.minuto) / 60_000;

/** "hoje às 17:00", "ontem às 23:00" ou "dia 14/12 às 16:00". */
export function formatUpdated(timestamp?: string | null, agora: Date = new Date()): string {
    const d = parseTimestamp(timestamp);
    if (!d) return 'sem dados recentes';
    const hoje = agoraEmNiteroi(agora);
    const diasAtras = Math.round(
        (Date.UTC(hoje.ano, hoje.mes - 1, hoje.dia) - Date.UTC(d.ano, d.mes - 1, d.dia)) / 86_400_000,
    );
    const hora = `${pad(d.hora)}:${pad(d.minuto)}`;
    if (diasAtras === 0) return `hoje às ${hora}`;
    if (diasAtras === 1) return `ontem às ${hora}`;
    return `dia ${pad(d.dia)}/${pad(d.mes)} às ${hora}`;
}

export function isStale(timestamp?: string | null, horas = 3, agora: Date = new Date()): boolean {
    const d = parseTimestamp(timestamp);
    if (!d) return true;
    return paraMinutos(agoraEmNiteroi(agora)) - paraMinutos(d) > horas * 60;
}

export function formatNumber(valor: number | null | undefined, casas = 1): string {
    if (valor === null || valor === undefined || Number.isNaN(valor)) return '–';
    return valor.toFixed(casas).replace('.', ',');
}

export function formatTemp(valor: number | null | undefined): string {
    return valor === null || valor === undefined ? '–' : `${Math.round(valor)}°`;
}

/** "2026-11-12" → "Boletim do INEA de 12/11 (há 4 dias)" */
export function descreverBoletim(data?: string | null, agora: Date = new Date()): string {
    const m = data?.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return 'Boletim do INEA';
    const [ano, mes, dia] = m.slice(1).map(Number);
    const hoje = agoraEmNiteroi(agora);
    const dias = Math.round((Date.UTC(hoje.ano, hoje.mes - 1, hoje.dia) - Date.UTC(ano, mes - 1, dia)) / 86_400_000);
    const quando = dias <= 0 ? 'hoje' : dias === 1 ? 'ontem' : `há ${dias} dias`;
    return `Boletim do INEA de ${pad(dia)}/${pad(mes)} (${quando})`;
}

/** "agora", "há 12 min", "há 3 h" a partir de um ISO com fuso */
export function tempoDesde(iso: string, agora: Date = new Date()): string {
    const minutos = Math.max(0, Math.round((agora.getTime() - new Date(iso).getTime()) / 60_000));
    if (minutos < 2) return 'agora';
    if (minutos < 60) return `há ${minutos} min`;
    return `há ${Math.floor(minutos / 60)} h`;
}
