import { Feather } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { Animated, Text } from 'react-native';
import { toneColors } from '../../theme';
import styles from './styles';

export interface MensagemAviso {
    texto: string;
    tipo: 'sucesso' | 'erro';
    id: number;
}

/** Mensagem curta que aparece e some sozinha, no lugar de um alerta. */
export default function Aviso({ mensagem, onFim }: { mensagem: MensagemAviso | null; onFim: () => void }) {
    const opacidade = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (!mensagem) return;
        opacidade.setValue(0);
        const animacao = Animated.sequence([
            Animated.timing(opacidade, { toValue: 1, duration: 180, useNativeDriver: true }),
            Animated.delay(mensagem.tipo === 'erro' ? 4500 : 2800),
            Animated.timing(opacidade, { toValue: 0, duration: 220, useNativeDriver: true }),
        ]);
        animacao.start(({ finished }) => finished && onFim());
        return () => animacao.stop();
    }, [mensagem, opacidade, onFim]);

    if (!mensagem) return null;
    const tom = toneColors[mensagem.tipo === 'erro' ? 'danger' : 'success'];
    return (
        <Animated.View
            style={[styles.aviso, { opacity: opacidade, backgroundColor: tom.bg, borderColor: tom.fg }]}
            accessibilityLiveRegion="polite"
            accessibilityRole="alert"
        >
            <Feather name={mensagem.tipo === 'erro' ? 'alert-circle' : 'check-circle'} size={18} color={tom.fg} />
            <Text style={styles.texto}>{mensagem.texto}</Text>
        </Animated.View>
    );
}
