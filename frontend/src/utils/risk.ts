import type { SituacaoPraia } from '../api/types';
import type { Tone } from '../theme';

export interface Nivel {
    rotulo: string;
    tom: Tone;
    mensagem?: string;
}

const SEM_DADOS: Nivel = { rotulo: 'Sem dados', tom: 'neutral' };
const vazio = (v: number | null | undefined): v is null | undefined => v === null || v === undefined;

export function nivelOnda(altura?: number | null): Nivel {
    if (vazio(altura)) return SEM_DADOS;
    if (altura < 0.5) return { rotulo: 'Calmo', tom: 'success', mensagem: 'Mar tranquilo' };
    if (altura < 2) return { rotulo: 'Moderado', tom: 'warning', mensagem: 'Atenção ao entrar no mar' };
    return { rotulo: 'Perigoso', tom: 'danger', mensagem: 'Ondas fortes, evite o banho' };
}

export const NIVEL_BAIA: Nivel = { rotulo: 'Mar de baía', tom: 'neutral' };

export function nivelVento(velocidade?: number | null): Nivel {
    if (vazio(velocidade)) return SEM_DADOS;
    if (velocidade < 20) return { rotulo: 'Seguro', tom: 'success' };
    if (velocidade < 35) return { rotulo: 'Moderado', tom: 'warning' };
    return { rotulo: 'Forte', tom: 'danger' };
}

export function nivelUV(uv?: number | null): Nivel {
    if (vazio(uv)) return SEM_DADOS;
    if (uv < 3) return { rotulo: 'Baixo', tom: 'success', mensagem: 'Não requer proteção especial' };
    if (uv < 6) return { rotulo: 'Moderado', tom: 'warning', mensagem: 'Use protetor solar e chapéu' };
    if (uv < 8) return { rotulo: 'Alto', tom: 'warning', mensagem: 'Protetor FPS 30+ e evite o sol entre 10h e 16h' };
    if (uv < 11) return { rotulo: 'Muito alto', tom: 'danger', mensagem: 'Evite o sol entre 10h e 16h; reaplique o protetor' };
    return { rotulo: 'Extremo', tom: 'danger', mensagem: 'Evite exposição ao sol' };
}

export function nivelBalneabilidade(balneabilidade?: boolean | null): Nivel {
    if (balneabilidade === true) return { rotulo: 'Própria', tom: 'success', mensagem: 'Própria para banho' };
    if (balneabilidade === false) return { rotulo: 'Imprópria', tom: 'danger', mensagem: 'Imprópria para banho' };
    return { rotulo: 'Sem dados', tom: 'neutral', mensagem: 'Balneabilidade sem informação' };
}

const NIVEL_PRAIA: Record<SituacaoPraia, Nivel> = {
    propria: { rotulo: 'Própria para banho', tom: 'success', mensagem: 'Própria para banho' },
    impropria: { rotulo: 'Imprópria para banho', tom: 'danger', mensagem: 'Imprópria para banho' },
    parcial: { rotulo: 'Parcialmente própria', tom: 'warning', mensagem: 'Parcialmente própria para banho' },
    sem_dados: { rotulo: 'Sem boletim recente', tom: 'neutral', mensagem: 'Sem informação sobre o banho' },
};

/** A praia toda: "Em parte" quando uns trechos estão próprios e outros não. */
export function nivelPraia(situacao: SituacaoPraia): Nivel {
    return NIVEL_PRAIA[situacao];
}

const PONTOS_CARDEAIS = [
    ['Norte', 'N'],
    ['Nordeste', 'NE'],
    ['Leste', 'L'],
    ['Sudeste', 'SE'],
    ['Sul', 'S'],
    ['Sudoeste', 'SO'],
    ['Oeste', 'O'],
    ['Noroeste', 'NO'],
] as const;

// graus (de onde o vento vem) → "Sudeste (SE)"
export function direcaoVento(graus?: number | null): string | null {
    if (vazio(graus)) return null;
    const indice = Math.round((((graus % 360) + 360) % 360) / 45) % 8;
    const [nome, sigla] = PONTOS_CARDEAIS[indice];
    return `${nome} (${sigla})`;
}
