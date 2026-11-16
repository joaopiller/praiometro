import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Text, View } from 'react-native';
import { type Tone } from '../../theme';
import styles from './styles';

interface Props {
    tone: Tone;
    title: string;
    subtitle?: string;
    icon: ComponentProps<typeof MaterialCommunityIcons>['name'];
}

// fundos em que o texto tem contraste para leitura; no amarelo, o texto é escuro
const CORES: Record<Tone, { fundo: string; texto: string; suave: string; marca: string }> = {
    success: { fundo: '#1F8548', texto: '#fff', suave: 'rgba(255,255,255,0.92)', marca: 'rgba(255,255,255,0.18)' },
    danger: { fundo: '#C93F33', texto: '#fff', suave: 'rgba(255,255,255,0.92)', marca: 'rgba(255,255,255,0.18)' },
    warning: { fundo: '#E8B03A', texto: '#2E2000', suave: '#4A3500', marca: 'rgba(46,32,0,0.14)' },
    neutral: { fundo: '#566F89', texto: '#fff', suave: 'rgba(255,255,255,0.92)', marca: 'rgba(255,255,255,0.18)' },
};

export default function StatusBanner({ tone, title, subtitle, icon }: Props) {
    const cor = CORES[tone];
    return (
        <View
            style={[styles.banner, { backgroundColor: cor.fundo }]}
            accessible
            accessibilityLabel={[title, subtitle].filter(Boolean).join('. ')}
        >
            <View style={[styles.iconCircle, { backgroundColor: cor.marca }]}>
                <MaterialCommunityIcons name={icon} size={28} color={cor.texto} />
            </View>
            <View style={styles.texts}>
                <Text style={[styles.title, { color: cor.texto }]}>{title}</Text>
                {subtitle ? <Text style={[styles.subtitle, { color: cor.suave }]}>{subtitle}</Text> : null}
            </View>
            <MaterialCommunityIcons name="waves" size={56} color={cor.marca} style={styles.watermark} />
        </View>
    );
}
