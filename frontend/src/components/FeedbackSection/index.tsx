import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { CRITERIOS, type Avaliacao } from '../../api/types';
import { colors } from '../../theme';
import { formatNumber } from '../../utils/format';
import GlassCard, { CardLabel } from '../GlassCard';
import StarRating from '../StarRating';
import styles from './styles';

interface Props {
    avaliacao?: Avaliacao;
    loading?: boolean;
    error?: boolean;
    onRetry?: () => void;
    onPress: () => void;
}

export default function FeedbackSection({ avaliacao, loading, error, onRetry, onPress }: Props) {
    const medias = avaliacao?.avaliacao_media;
    const exatas = avaliacao?.medias_exatas ?? medias;
    const total = avaliacao?.total_avaliacoes ?? 0;
    const geral =
        avaliacao?.nota_geral ??
        (exatas ? Object.values(exatas).reduce((a, b) => a + b, 0) / Object.values(exatas).length : null);

    return (
        <GlassCard style={styles.card}>
            <CardLabel icon={<MaterialCommunityIcons name="account-group" size={18} color={colors.label} />}>
                Avaliação dos banhistas
            </CardLabel>

            {loading ? (
                <Text style={styles.empty}>Carregando avaliações...</Text>
            ) : error ? (
                <Pressable onPress={onRetry} accessibilityRole="button">
                    <Text style={styles.empty}>Não foi possível carregar as avaliações. Toque para tentar de novo.</Text>
                </Pressable>
            ) : medias && geral !== null ? (
                <>
                    <View style={styles.summary} accessible accessibilityLabel={`Nota geral ${formatNumber(geral)} de 5, ${total} avaliações`}>
                        <Text style={styles.score}>{formatNumber(geral)}</Text>
                        <View style={styles.summaryRight}>
                            <StarRating value={Math.round(geral * 2) / 2} size={22} label="Nota geral" />
                            <Text style={styles.count}>
                                {total ? `${total} ${total === 1 ? 'avaliação' : 'avaliações'}` : 'Nota geral'}
                            </Text>
                        </View>
                    </View>
                    <View style={styles.list}>
                        {CRITERIOS.map(({ key, label }) => {
                            const valor = exatas?.[key] ?? 0;
                            return (
                                <View key={key} style={styles.row} accessible accessibilityLabel={`${label}: ${formatNumber(valor)} de 5`}>
                                    <Text style={styles.criterio}>{label}</Text>
                                    <View style={styles.track}>
                                        <View style={[styles.fill, { width: `${(valor / 5) * 100}%` }]} />
                                    </View>
                                    <Text style={styles.value}>{formatNumber(valor)}</Text>
                                </View>
                            );
                        })}
                    </View>
                </>
            ) : (
                <View style={styles.emptyBox}>
                    <MaterialCommunityIcons name="star-shooting-outline" size={36} color={colors.sand} />
                    <Text style={styles.empty}>Ninguém avaliou esta praia ainda. Seja o primeiro!</Text>
                </View>
            )}

            <Pressable
                onPress={onPress}
                accessibilityRole="button"
                style={({ pressed }) => [styles.button, pressed && styles.pressed]}
            >
                <MaterialCommunityIcons name="star-plus" size={20} color={colors.brand} />
                <Text style={styles.buttonText}>Avaliar esta praia</Text>
            </Pressable>
            <Text style={styles.hint}>Você pode atualizar sua avaliação quando quiser.</Text>
        </GlassCard>
    );
}
