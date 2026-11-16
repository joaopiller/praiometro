import { useEffect, useRef, type ReactNode } from 'react';
import { Animated, Easing, Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import styles from './styles';

interface Props {
    visible: boolean;
    onClose: () => void;
    children: ReactNode;
    /** impede fechar tocando fora (ex.: durante um envio) */
    bloqueado?: boolean;
}

export default function BottomSheet({ visible, onClose, children, bloqueado }: Props) {
    const insets = useSafeAreaInsets();
    const deslocamento = useRef(new Animated.Value(400)).current;

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

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={fechar} statusBarTranslucent>
            <Pressable style={styles.fundo} onPress={fechar} accessibilityLabel="Fechar">
                <Animated.View
                    style={[styles.folha, { paddingBottom: insets.bottom + 24, transform: [{ translateY: deslocamento }] }]}
                >
                    <Pressable onPress={() => {}} accessible={false}>
                        <View style={styles.alca} />
                        {children}
                    </Pressable>
                </Animated.View>
            </Pressable>
        </Modal>
    );
}
