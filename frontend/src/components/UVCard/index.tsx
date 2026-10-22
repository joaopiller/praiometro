import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Text, View } from 'react-native';
import { colors, MAX_FONT_SCALE_NUMEROS } from '../../theme';
import { formatNumber } from '../../utils/format';
import { nivelUV } from '../../utils/risk';
import Badge from '../Badge';
import GlassCard, { CardLabel } from '../GlassCard';
import styles from './styles';

const UV_MAX = 12;

export default function UVCard({ uv }: { uv?: number | null }) {
    const nivel = nivelUV(uv);
    const posicao = uv === null || uv === undefined ? null : Math.min(uv, UV_MAX) / UV_MAX;
    return (
        <GlassCard style={styles.card} accessibilityLabel={`Índice UV ${formatNumber(uv)}, ${nivel.rotulo}`}>
            <View style={styles.content}>
                <CardLabel icon={<MaterialCommunityIcons name="white-balance-sunny" size={20} color={colors.sun} />}>
                    Índice UV
                </CardLabel>
                <View style={styles.valueRow}>
                    <Text style={styles.value} maxFontSizeMultiplier={MAX_FONT_SCALE_NUMEROS}>
                        {formatNumber(uv)}
                    </Text>
                    <Badge label={nivel.rotulo} tone={nivel.tom} />
                </View>
                {nivel.mensagem && (
                    <View style={styles.tipRow}>
                        <Feather name="info" size={16} color={colors.label} style={{ marginTop: 2 }} />
                        <Text style={styles.tip}>{nivel.mensagem}</Text>
                    </View>
                )}
            </View>
            <View style={styles.scale}>
                <LinearGradient colors={[...colors.uvGradient].reverse() as [string, string, ...string[]]} style={styles.bar} />
                {posicao !== null && <View style={[styles.marker, { bottom: `${posicao * 100}%` }]} />}
            </View>
        </GlassCard>
    );
}
