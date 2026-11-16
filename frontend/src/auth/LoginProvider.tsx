import { FontAwesome } from '@expo/vector-icons';
import * as AppleAuthentication from 'expo-apple-authentication';
import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import BottomSheet from '../components/BottomSheet';
import { FOLHA } from '../components/BottomSheet/styles';
import { colors, radius, spacing } from '../theme';
import { appleDisponivel, obterTokenApple } from './apple';
import { obterIdToken } from './google';

type Pedido = { resolve: (token: string | null) => void; reject: (erro: unknown) => void };
type Login = { pedirLogin: () => Promise<string | null> };

// fora do provider (ou no Android) o login é sempre o do Google
const LoginContext = createContext<Login>({ pedirLogin: obterIdToken });

export function useLogin() {
    return useContext(LoginContext);
}

// a folha precisa terminar de fechar antes de abrir a tela de login do sistema
const esperarFechar = () => new Promise((r) => setTimeout(r, 350));

export function LoginProvider({ children }: { children: ReactNode }) {
    const [comApple, setComApple] = useState(false);
    const [aberto, setAberto] = useState(false);
    const pedido = useRef<Pedido | null>(null);

    useEffect(() => {
        appleDisponivel().then(setComApple);
    }, []);

    const pedirLogin = useCallback(() => {
        if (!comApple) return obterIdToken();
        return new Promise<string | null>((resolve, reject) => {
            pedido.current = { resolve, reject };
            setAberto(true);
        });
    }, [comApple]);

    const entrarCom = (obter: () => Promise<string | null>) => async () => {
        const atual = pedido.current;
        pedido.current = null;
        setAberto(false);
        await esperarFechar();
        try {
            atual?.resolve(await obter());
        } catch (erro) {
            atual?.reject(erro);
        }
    };

    const cancelar = () => {
        pedido.current?.resolve(null);
        pedido.current = null;
        setAberto(false);
    };

    return (
        <LoginContext.Provider value={{ pedirLogin }}>
            {children}
            <BottomSheet visible={aberto} onClose={cancelar}>
                <Text style={styles.titulo} accessibilityRole="header">
                    Entre para continuar
                </Text>
                <Text style={styles.subtitulo}>Escolha como você quer entrar.</Text>
                <View style={styles.botoes}>
                    {/* a Apple exige o botão oficial, com o mesmo destaque das outras opções */}
                    <AppleAuthentication.AppleAuthenticationButton
                        buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
                        buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                        cornerRadius={radius.md}
                        style={styles.botao}
                        onPress={entrarCom(obterTokenApple)}
                    />
                    <Pressable
                        onPress={entrarCom(obterIdToken)}
                        accessibilityRole="button"
                        style={({ pressed }) => [styles.botao, styles.google, pressed && styles.pressionado]}
                    >
                        <FontAwesome name="google" size={18} color="#1F1F1F" />
                        <Text style={styles.googleTexto}>Continuar com o Google</Text>
                    </Pressable>
                    <Pressable onPress={cancelar} accessibilityRole="button" style={styles.cancelar}>
                        <Text style={styles.cancelarTexto}>Agora não</Text>
                    </Pressable>
                </View>
            </BottomSheet>
        </LoginContext.Provider>
    );
}

const styles = StyleSheet.create({
    titulo: { fontSize: 20, fontWeight: '800', color: colors.brand, textAlign: 'center' },
    subtitulo: { fontSize: 14, color: FOLHA.textoSuave, textAlign: 'center', marginTop: spacing.xs },
    botoes: { gap: spacing.sm, marginTop: spacing.lg },
    botao: { height: 50, width: '100%' },
    google: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: '#747775',
        backgroundColor: '#FFFFFF',
    },
    pressionado: { opacity: 0.8 },
    googleTexto: { fontSize: 16, fontWeight: '600', color: '#1F1F1F' },
    cancelar: { alignItems: 'center', paddingVertical: spacing.md },
    cancelarTexto: { color: FOLHA.textoSuave, fontSize: 15, fontWeight: '600' },
});
