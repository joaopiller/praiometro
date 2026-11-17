import { Feather } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { colors } from '../../theme';
import { formatUpdated, isStale } from '../../utils/format';
import styles from './styles';

interface Props {
    timestamp?: string | null;
    refreshError?: boolean;
}

/** O que avisar sobre a idade dos dados; nada quando estão em dia. */
export function textoDoAviso(timestamp?: string | null, refreshError?: boolean): string | null {
    if (!refreshError && !isStale(timestamp)) return null;
    const quando = timestamp ? formatUpdated(timestamp) : null;
    if (refreshError) return `Não foi possível atualizar agora.${quando ? ` Mostrando dados de ${quando}.` : ''}`;
    return quando
        ? `Dados de ${quando}. Podem não refletir a situação atual.`
        : 'Sem dados recentes. As informações podem não refletir a situação atual.';
}

export default function DataNotice({ timestamp, refreshError }: Props) {
    const texto = textoDoAviso(timestamp, refreshError);
    if (!texto) return null;
    return (
        <View style={styles.box} accessibilityRole="alert">
            <Feather name={refreshError ? 'wifi-off' : 'clock'} size={18} color={colors.warning} />
            <Text style={styles.text}>{texto}</Text>
        </View>
    );
}
