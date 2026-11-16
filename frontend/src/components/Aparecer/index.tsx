import { useEffect, useState, type ReactNode } from 'react';
import { Animated, Easing, type StyleProp, type ViewStyle } from 'react-native';
import { useMovimentoReduzido } from '../../hooks/useMovimentoReduzido';

interface Props {
    /** quando muda, o conteúdo entra de novo */
    chave?: string | number;
    style?: StyleProp<ViewStyle>;
    children: ReactNode;
}

/** Faz o conteúdo surgir de leve (opacidade e um pequeno deslize) ao aparecer ou trocar. */
export default function Aparecer({ chave, style, children }: Props) {
    const [progresso] = useState(() => new Animated.Value(0));
    const semMovimento = useMovimentoReduzido();

    useEffect(() => {
        if (semMovimento) {
            progresso.setValue(1);
            return;
        }
        progresso.setValue(0);
        const animacao = Animated.timing(progresso, {
            toValue: 1,
            duration: 260,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        });
        animacao.start();
        return () => animacao.stop();
    }, [chave, progresso, semMovimento]);

    const translateY = progresso.interpolate({ inputRange: [0, 1], outputRange: [8, 0] });
    return <Animated.View style={[style, { opacity: progresso, transform: [{ translateY }] }]}>{children}</Animated.View>;
}
