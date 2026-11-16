import type { ComponentProps } from 'react';
import type { MaterialCommunityIcons } from '@expo/vector-icons';
import type { TipoRelato } from '../api/types';
import type { Tone } from '../theme';

type Icone = ComponentProps<typeof MaterialCommunityIcons>['name'];

// em pares, como aparecem na tela (duas colunas)
export const TIPOS_RELATO: { tipo: TipoRelato; rotulo: string; icone: Icone; tom: Tone }[] = [
    { tipo: 'lotada', rotulo: 'Lotada', icone: 'account-group', tom: 'warning' },
    { tipo: 'tranquila', rotulo: 'Tranquila', icone: 'beach', tom: 'success' },
    { tipo: 'agua_limpa', rotulo: 'Água limpa', icone: 'water-check', tom: 'success' },
    { tipo: 'agua_turva', rotulo: 'Água turva', icone: 'water-opacity', tom: 'warning' },
    { tipo: 'mar_agitado', rotulo: 'Mar agitado', icone: 'waves', tom: 'warning' },
    { tipo: 'bandeira_vermelha', rotulo: 'Bandeira vermelha', icone: 'flag-variant', tom: 'danger' },
    { tipo: 'agua_viva', rotulo: 'Água-viva', icone: 'jellyfish', tom: 'danger' },
    { tipo: 'lixo', rotulo: 'Lixo na areia', icone: 'trash-can-outline', tom: 'warning' },
];

/** Opções que não fazem sentido juntas: marcar uma desmarca a outra. */
export const OPOSTOS: Partial<Record<TipoRelato, TipoRelato>> = {
    lotada: 'tranquila',
    tranquila: 'lotada',
    agua_limpa: 'agua_turva',
    agua_turva: 'agua_limpa',
};

export function infoRelato(tipo: TipoRelato) {
    return TIPOS_RELATO.find((t) => t.tipo === tipo) ?? { tipo, rotulo: tipo, icone: 'information' as Icone, tom: 'neutral' as Tone };
}
