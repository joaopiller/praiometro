import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { colors } from '../../theme';
import styles from './styles';

interface Props {
    loading?: boolean;
    error?: string | null;
    onRetry?: () => void;
    compact?: boolean;
}

export default function StateView({ loading, error, onRetry, compact }: Props) {
    if (loading) {
        return (
            <View style={[styles.container, compact && styles.compact]} accessibilityLiveRegion="polite">
                <ActivityIndicator color={colors.text} size={compact ? 'small' : 'large'} />
                {!compact && <Text style={styles.message}>Carregando...</Text>}
            </View>
        );
    }
    return (
        <View style={[styles.container, compact && styles.compact]} accessibilityLiveRegion="polite">
            {!compact && <MaterialCommunityIcons name="umbrella-beach-outline" size={72} color={colors.sand} />}
            <Text style={[styles.title, compact && styles.compactText]}>{error ?? 'Algo deu errado.'}</Text>
            {onRetry && (
                <Pressable
                    onPress={onRetry}
                    accessibilityRole="button"
                    style={({ pressed }) => [styles.button, pressed && styles.pressed]}
                >
                    <MaterialCommunityIcons name="refresh" size={18} color={colors.brand} />
                    <Text style={styles.buttonText}>Tentar novamente</Text>
                </Pressable>
            )}
        </View>
    );
}
