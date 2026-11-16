import { Feather } from '@expo/vector-icons';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Pressable, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { toneColors, type Tone } from '../../theme';
import styles from './styles';

export type TipoAviso = 'sucesso' | 'erro' | 'info';

interface Mensagem {
    texto: string;
    tipo: TipoAviso;
    id: number;
}

const TOM: Record<TipoAviso, Tone> = { sucesso: 'success', erro: 'danger', info: 'neutral' };
const ICONE = { sucesso: 'check-circle', erro: 'alert-circle', info: 'info' } as const;

const AvisoContext = createContext<(texto: string, tipo?: TipoAviso) => void>(() => {});

/** Mostra uma mensagem curta no topo da tela, no lugar dos alertas do sistema. */
export function useAviso() {
    return useContext(AvisoContext);
}

export function AvisoProvider({ children }: { children: ReactNode }) {
    const [mensagem, setMensagem] = useState<Mensagem | null>(null);
    const avisar = useCallback((texto: string, tipo: TipoAviso = 'sucesso') => {
        setMensagem({ texto, tipo, id: Date.now() });
    }, []);

    return (
        <AvisoContext.Provider value={avisar}>
            {children}
            <AvisoFlutuante mensagem={mensagem} onFim={() => setMensagem(null)} />
        </AvisoContext.Provider>
    );
}

function AvisoFlutuante({ mensagem, onFim }: { mensagem: Mensagem | null; onFim: () => void }) {
    const insets = useSafeAreaInsets();
    const progresso = useRef(new Animated.Value(0)).current;
    const fim = useRef(onFim);
    fim.current = onFim;

    useEffect(() => {
        if (!mensagem) return;
        progresso.setValue(0);
        const animacao = Animated.sequence([
            Animated.spring(progresso, { toValue: 1, useNativeDriver: true, speed: 18, bounciness: 6 }),
            Animated.delay(mensagem.tipo === 'erro' ? 4500 : 3000),
            Animated.timing(progresso, { toValue: 0, duration: 220, useNativeDriver: true }),
        ]);
        animacao.start(({ finished }) => finished && fim.current());
        return () => animacao.stop();
    }, [mensagem, progresso]);

    if (!mensagem) return null;
    const tom = toneColors[TOM[mensagem.tipo]];
    const translateY = progresso.interpolate({ inputRange: [0, 1], outputRange: [-24, 0] });

    return (
        <Animated.View
            pointerEvents="box-none"
            style={[styles.camada, { top: insets.top + 64, opacity: progresso, transform: [{ translateY }] }]}
        >
            <Pressable
                onPress={() => fim.current()}
                accessibilityRole="alert"
                accessibilityLiveRegion="polite"
                accessibilityHint="Toque para fechar"
                style={[styles.aviso, { borderColor: tom.fg }]}
            >
                <Feather name={ICONE[mensagem.tipo]} size={20} color={tom.fg} />
                <Text style={styles.texto}>{mensagem.texto}</Text>
            </Pressable>
        </Animated.View>
    );
}
