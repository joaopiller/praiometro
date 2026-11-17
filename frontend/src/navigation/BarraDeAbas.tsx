import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useEffect, useState } from 'react';
import { Animated, Keyboard, Pressable, StyleSheet, Text, View, type LayoutChangeEvent } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMovimentoReduzido } from '../hooks/useMovimentoReduzido';

// medidas da barra do iPhone (iOS 26), para o Android ficar com a mesma cara
export const ALTURA_BARRA = 60;
const MARGEM_LATERAL = 21;
const RESPIRO = 11;
const COR_ATIVA = '#00305D';
const COR_INATIVA = '#0B1620';

/** Distância da barra até a borda de baixo da tela. */
export const baseDaBarra = (insetInferior: number) => Math.max(insetInferior, 16);

/** Barra de abas flutuante, desenhada à mão no Android no lugar da barra padrão. */
export default function BarraDeAbas({ state, descriptors, navigation }: BottomTabBarProps) {
    const insets = useSafeAreaInsets();
    const semMovimento = useMovimentoReduzido();
    const [largura, setLargura] = useState(0);
    const [posicao] = useState(() => new Animated.Value(state.index));
    const [tecladoAberto, setTecladoAberto] = useState(false);

    useEffect(() => {
        const abriu = Keyboard.addListener('keyboardDidShow', () => setTecladoAberto(true));
        const fechou = Keyboard.addListener('keyboardDidHide', () => setTecladoAberto(false));
        return () => {
            abriu.remove();
            fechou.remove();
        };
    }, []);

    useEffect(() => {
        if (semMovimento) {
            posicao.setValue(state.index);
            return;
        }
        const animacao = Animated.spring(posicao, { toValue: state.index, useNativeDriver: true, speed: 20, bounciness: 4 });
        animacao.start();
        return () => animacao.stop();
    }, [state.index, posicao, semMovimento]);

    if (tecladoAberto) return null;

    const larguraAba = largura ? (largura - RESPIRO * 2) / state.routes.length : 0;
    const translateX = posicao.interpolate({
        inputRange: state.routes.map((_, i) => i),
        outputRange: state.routes.map((_, i) => RESPIRO + i * larguraAba),
    });

    return (
        <View
            style={[styles.barra, { bottom: baseDaBarra(insets.bottom) }]}
            onLayout={(e: LayoutChangeEvent) => setLargura(e.nativeEvent.layout.width)}
            accessibilityRole="tablist"
        >
            {larguraAba ? (
                <Animated.View style={[styles.capsula, { width: larguraAba, transform: [{ translateX }] }]} />
            ) : null}
            {state.routes.map((rota, i) => {
                const { options } = descriptors[rota.key];
                const ativa = state.index === i;
                const cor = ativa ? COR_ATIVA : COR_INATIVA;
                const titulo = options.title ?? rota.name;
                const aoTocar = () => {
                    const evento = navigation.emit({ type: 'tabPress', target: rota.key, canPreventDefault: true });
                    if (!ativa && !evento.defaultPrevented) navigation.navigate(rota.name, rota.params);
                };
                return (
                    <Pressable
                        key={rota.key}
                        onPress={aoTocar}
                        onLongPress={() => navigation.emit({ type: 'tabLongPress', target: rota.key })}
                        style={styles.aba}
                        accessibilityRole="tab"
                        accessibilityState={{ selected: ativa }}
                        accessibilityLabel={titulo}
                    >
                        {options.tabBarIcon?.({ focused: ativa, color: cor, size: 25 })}
                        <Text style={[styles.rotulo, { color: cor }]} numberOfLines={1}>
                            {titulo}
                        </Text>
                    </Pressable>
                );
            })}
        </View>
    );
}

const styles = StyleSheet.create({
    barra: {
        position: 'absolute',
        left: MARGEM_LATERAL,
        right: MARGEM_LATERAL,
        height: ALTURA_BARRA,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: RESPIRO,
        borderRadius: ALTURA_BARRA / 2,
        // sem o vidro do iOS: o mesmo azul-claro, quase opaco, para o que passa por baixo não embaralhar
        backgroundColor: 'rgba(146,203,239,0.86)',
        borderWidth: StyleSheet.hairlineWidth,
        borderColor: 'rgba(255,255,255,0.55)',
        elevation: 10,
        shadowColor: '#001B33',
        shadowOpacity: 0.3,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 4 },
    },
    capsula: {
        position: 'absolute',
        left: 0,
        top: 4,
        bottom: 4,
        borderRadius: (ALTURA_BARRA - 8) / 2,
        backgroundColor: 'rgba(1,84,134,0.28)',
    },
    aba: { flex: 1, height: '100%', alignItems: 'center', justifyContent: 'center', gap: 1 },
    rotulo: { fontSize: 11, fontWeight: '600', letterSpacing: 0.1 },
});
