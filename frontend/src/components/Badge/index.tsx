import { Feather } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { toneColors, type Tone } from '../../theme';
import styles from './styles';

const ICONES: Record<Tone, keyof typeof Feather.glyphMap> = {
    success: 'check',
    warning: 'alert-triangle',
    danger: 'alert-octagon',
    neutral: 'help-circle',
};

interface Props {
    label: string;
    tone: Tone;
    showIcon?: boolean;
    /** para usar sobre fundo claro */
    claro?: boolean;
}

export default function Badge({ label, tone, showIcon = true, claro }: Props) {
    const c = toneColors[tone];
    const cor = claro ? c.solid : c.fg;
    return (
        <View
            style={[styles.badge, { backgroundColor: claro ? `${c.solid}1A` : c.bg, borderColor: cor }]}
            accessibilityLabel={label}
        >
            {showIcon && <Feather name={ICONES[tone]} size={12} color={cor} />}
            <Text style={[styles.text, { color: cor }]}>{label.toUpperCase()}</Text>
        </View>
    );
}
