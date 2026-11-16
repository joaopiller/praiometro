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

// fundos escuros o bastante para o texto branco ter contraste de leitura;
// o da atenção é um âmbar alaranjado, porque sobre o amarelo dos pins o branco some
const FUNDOS: Record<Tone, string> = {
    success: '#1F8548',
    danger: '#C93F33',
    warning: '#B06107',
    neutral: '#566F89',
};

export default function StatusBanner({ tone, title, subtitle, icon }: Props) {
    return (
        <View
            style={[styles.banner, { backgroundColor: FUNDOS[tone] }]}
            accessible
            accessibilityLabel={[title, subtitle].filter(Boolean).join('. ')}
        >
            <View style={styles.iconCircle}>
                <MaterialCommunityIcons name={icon} size={28} color="#fff" />
            </View>
            <View style={styles.texts}>
                <Text style={styles.title}>{title}</Text>
                {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
            </View>
            <MaterialCommunityIcons name="waves" size={56} color="rgba(255,255,255,0.18)" style={styles.watermark} />
        </View>
    );
}
