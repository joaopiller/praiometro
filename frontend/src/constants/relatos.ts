import type { ComponentProps } from 'react';
import type { MaterialCommunityIcons } from '@expo/vector-icons';
import type { TipoRelato } from '../api/types';
import type { Tone } from '../theme';

type Icone = ComponentProps<typeof MaterialCommunityIcons>['name'];

export const TIPOS_RELATO: { tipo: TipoRelato; rotulo: string; icone: Icone; tom: Tone }[] = [
    { tipo: 'lotada', rotulo: 'Lotada', icone: 'account-group', tom: 'warning' },
    { tipo: 'tranquila', rotulo: 'Tranquila', icone: 'beach', tom: 'success' },
    { tipo: 'agua_viva', rotulo: 'Água-viva', icone: 'jellyfish', tom: 'danger' },
    { tipo: 'lixo', rotulo: 'Lixo na areia', icone: 'trash-can-outline', tom: 'warning' },
    { tipo: 'mar_agitado', rotulo: 'Mar agitado', icone: 'waves', tom: 'warning' },
    { tipo: 'bandeira_vermelha', rotulo: 'Bandeira vermelha', icone: 'flag-variant', tom: 'danger' },
    { tipo: 'agua_turva', rotulo: 'Água turva', icone: 'water-opacity', tom: 'warning' },
];

export function infoRelato(tipo: TipoRelato) {
    return TIPOS_RELATO.find((t) => t.tipo === tipo) ?? { tipo, rotulo: tipo, icone: 'information' as Icone, tom: 'neutral' as Tone };
}
