import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import type { Regiao } from '../../api/types';
import { colors } from '../../theme';
import { formatHour } from '../../utils/format';
import { estadoMare, solDeHoje } from '../../utils/mare';
import GlassCard, { CardLabel } from '../GlassCard';
import styles from './styles';

export default function SolMare({ regiao }: { regiao?: Regiao }) {
    const sol = solDeHoje(regiao?.sol);
    const mare = estadoMare(regiao?.mare?.extremos);
    if (!sol && !mare) return null;

    return (
        <View style={styles.linha}>
            {sol && (
                <GlassCard style={styles.card} accessibilityLabel={`Sol nasce às ${formatHour(sol.nascer)} e se põe às ${formatHour(sol.por)}`}>
                    <CardLabel icon={<MaterialCommunityIcons name="weather-sunset" size={18} color={colors.sun} />}>Sol</CardLabel>
                    <View style={styles.item}>
                        <MaterialCommunityIcons name="arrow-up" size={16} color={colors.sand} />
                        <Text style={styles.hora}>{formatHour(sol.nascer)}</Text>
                    </View>
                    <View style={styles.item}>
                        <MaterialCommunityIcons name="arrow-down" size={16} color={colors.sand} />
                        <Text style={styles.hora}>{formatHour(sol.por)}</Text>
                    </View>
                </GlassCard>
            )}
            {mare && (
                <GlassCard
                    style={styles.card}
                    accessibilityLabel={`Maré ${mare.tendencia}. Próxima maré ${mare.proxima.tipo} às ${formatHour(mare.proxima.hora)}`}
                >
                    <CardLabel icon={<MaterialCommunityIcons name="waves-arrow-up" size={18} color={colors.label} />}>Maré</CardLabel>
                    <Text style={styles.tendencia}>{mare.tendencia === 'enchendo' ? 'Enchendo' : 'Vazando'}</Text>
                    <Text style={styles.detalhe}>
                        {mare.proxima.tipo === 'alta' ? 'Alta' : 'Baixa'} às {formatHour(mare.proxima.hora)}
                    </Text>
                </GlassCard>
            )}
        </View>
    );
}
