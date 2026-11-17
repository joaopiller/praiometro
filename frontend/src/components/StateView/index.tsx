import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Pressable, Text, View } from 'react-native';
import { colors } from '../../theme';
import styles from './styles';

const selo = require('../../../assets/images/selo.png');

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
            {!compact && demorando && (
                <Text style={styles.demora}>
                    Está demorando mais que o normal. Depois de um tempo sem uso, o servidor leva até um minuto para voltar.
                </Text>
            )}
        </View>
    );
}

export default function StateView({ loading, error, onRetry, compact }: Props) {
    if (loading) return <Carregando compact={compact} />;
    return (
        <View style={[styles.container, compact && styles.compact]} accessibilityLiveRegion="polite">
            {!compact && <Image source={selo} style={styles.selo} accessibilityIgnoresInvertColors />}
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
