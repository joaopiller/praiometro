import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { MAX_FONT_SCALE_NUMEROS } from '../../theme';
import type { Nivel } from '../../utils/risk';
import Badge from '../Badge';
import GlassCard, { CardLabel } from '../GlassCard';
import styles from './styles';

interface Props {
    label: string;
    icon?: ReactNode;
    value?: string;
    unit?: string;
    /** texto exibido no lugar do valor quando não há número confiável */
    nota?: string;
    nivel?: Nivel;
    footer?: string | null;
    footerIcon?: ReactNode;
}

export default function MetricCard({ label, icon, value, unit, nota, nivel, footer, footerIcon }: Props) {
    return (
        <GlassCard
            style={styles.card}
            accessibilityLabel={[`${label}: ${nota ?? `${value} ${unit ?? ''}`}`, nivel?.rotulo, footer].filter(Boolean).join('. ')}
        >
            <CardLabel right={icon}>{label}</CardLabel>
            {nivel && <Badge label={nivel.rotulo} tone={nivel.tom} />}
            {nota ? (
                <Text style={styles.nota}>{nota}</Text>
            ) : (
                <View style={styles.valueRow}>
                    <Text style={styles.value} adjustsFontSizeToFit numberOfLines={1} maxFontSizeMultiplier={MAX_FONT_SCALE_NUMEROS}>
                        {value}
                    </Text>
                    {unit ? <Text style={styles.unit}>{unit}</Text> : null}
                </View>
            )}
            {footer ? (
                <View style={styles.footer}>
                    {footerIcon}
                    <Text style={styles.footerText}>{footer}</Text>
                </View>
            ) : null}
        </GlassCard>
    );
}
