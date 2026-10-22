import { Feather } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { colors } from '../../theme';
import { formatUpdated, isStale } from '../../utils/format';
import styles from './styles';

interface Props {
    timestamp?: string | null;
    refreshError?: boolean;
}

export default function DataNotice({ timestamp, refreshError }: Props) {
    const velho = isStale(timestamp);
    if (!refreshError && !velho) return null;
    const texto = refreshError
        ? `Sem conexão com o servidor. Mostrando dados de ${formatUpdated(timestamp)}.`
        : `Dados de ${formatUpdated(timestamp)}. Podem não refletir a situação atual.`;
    return (
        <View style={styles.box} accessibilityRole="alert">
            <Feather name={refreshError ? 'wifi-off' : 'clock'} size={18} color={colors.warning} />
            <Text style={styles.text}>{texto}</Text>
        </View>
    );
}
