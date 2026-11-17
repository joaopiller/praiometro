import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { colors } from '../../theme';
import styles from './styles';

interface Props {
    loading?: boolean;
    error?: string | null;
    onRetry?: () => void;
    compact?: boolean;
}

function Carregando({ compact }: { compact?: boolean }) {
    // depois de alguns segundos, diz que está demorando: melhor do que uma roleta muda
    const [demorando, setDemorando] = useState(false);
    useEffect(() => {
        const espera = setTimeout(() => setDemorando(true), 4000);
        return () => clearTimeout(espera);
    }, []);
    return (
        <View style={[styles.container, compact && styles.compact]} accessibilityLiveRegion="polite">
            <ActivityIndicator color={colors.text} size={compact ? 'small' : 'large'} />
            {!compact && <Text style={styles.message}>Carregando...</Text>}
            {!compact && demorando && <Text style={styles.demora}>Está demorando. Verifique sua conexão com a internet.</Text>}
        </View>
    );
}

export default function StateView({ loading, error, onRetry, compact }: Props) {
    if (loading) return <Carregando compact={compact} />;
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
