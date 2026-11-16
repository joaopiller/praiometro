import { useEffect, useState, type ReactNode } from 'react';
import { Animated, Easing, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styles from './styles';

interface Props {
    visible: boolean;
    onClose: () => void;
    children: ReactNode;
    /** impede fechar tocando fora (ex.: durante um envio) */
    bloqueado?: boolean;
    /** desenha como camada, sem abrir outro Modal: no iOS um Modal não abre por cima de outro já aberto */
    embutido?: boolean;
    /** camada extra dentro do Modal, por cima da folha (ex.: a escolha de login) */
    sobreposicao?: ReactNode;
}

export default function BottomSheet({ visible, onClose, children, bloqueado, embutido, sobreposicao }: Props) {
    const insets = useSafeAreaInsets();
    const [deslocamento] = useState(() => new Animated.Value(400));

    useEffect(() => {
        if (!visible) return;
        deslocamento.setValue(400);
        Animated.timing(deslocamento, {
            toValue: 0,
            duration: 260,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
        }).start();
    }, [visible, deslocamento]);

    const fechar = () => {
        if (!bloqueado) onClose();
    };

    const folha = (
        // o fundo fecha ao toque, mas não é um elemento do leitor de tela: se fosse, esconderia a folha inteira
        <Pressable style={styles.fundo} onPress={fechar} accessible={false}>
            <Animated.View
                accessibilityViewIsModal
                onAccessibilityEscape={fechar}
                style={[styles.folha, { paddingBottom: insets.bottom + 24, transform: [{ translateY: deslocamento }] }]}
            >
                <Pressable onPress={() => {}} accessible={false}>
                    <View style={styles.alca} />
                    {children}
                </Pressable>
            </Animated.View>
        </Pressable>
    );

    if (embutido) return visible ? <View style={StyleSheet.absoluteFill}>{folha}</View> : null;

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={fechar} statusBarTranslucent>
            {folha}
            {sobreposicao}
        </Modal>
    );
}
