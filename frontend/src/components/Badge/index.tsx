import { Text, View } from 'react-native';
import { colors, MAX_FONT_SCALE_FIXO, toneColors, type Tone } from '../../theme';
import styles from './styles';

interface Props {
    label: string;
    tone: Tone;
    /** para usar sobre fundo claro */
    claro?: boolean;
    /** dentro de uma caixa de altura fixa: uma linha só e fonte que não cresce demais */
    fixo?: boolean;
}

/**
 * Situação com um ponto colorido na frente, como o "Aberto agora" dos apps de mapa.
 * Sobre o azul o texto é branco: colorido, o vermelho ficava difícil de ler no sol.
 */
export default function Badge({ label, tone, claro, fixo }: Props) {
    const c = toneColors[tone];
    return (
        <View style={styles.badge} accessibilityLabel={label}>
            <View style={[styles.ponto, { backgroundColor: claro ? c.solid : c.fg }]} />
            <Text
                style={[styles.text, { color: claro ? c.escuro : colors.text }]}
                numberOfLines={fixo ? 1 : 2}
                maxFontSizeMultiplier={fixo ? MAX_FONT_SCALE_FIXO : undefined}
            >
                {label}
            </Text>
        </View>
    );
}
