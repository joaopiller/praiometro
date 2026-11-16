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
/** sobreModal: o pedido vem de dentro de um Modal aberto, que precisa mostrar <LoginSobreModal /> */
type Opcoes = { sobreModal?: boolean };
type Login = { pedirLogin: (opcoes?: Opcoes) => Promise<string | null> };
type Folha = {
    aberto: boolean;
    sobreModal: boolean;
    entrarComApple: () => void;
    entrarComGoogle: () => void;
    cancelar: () => void;
};

// fora do provider (ou no Android) o login é sempre o do Google
const LoginContext = createContext<Login>({ pedirLogin: obterIdToken });
const FolhaContext = createContext<Folha | null>(null);

export function useLogin() {
    return useContext(LoginContext);
}

/**
 * No iOS um Modal não abre por cima de outro: quem pede login de dentro de um Modal
 * coloca isto dentro dele, e a escolha de login aparece ali mesmo.
 */
export function LoginSobreModal() {
    const folha = useContext(FolhaContext);
    if (!folha) return null;
    return (
        <BottomSheet embutido visible={folha.aberto && folha.sobreModal} onClose={folha.cancelar}>
            <EscolhaDeLogin {...folha} />
        </BottomSheet>
    );
}

// a folha precisa terminar de fechar antes de abrir a tela de login do sistema
const esperarFechar = () => new Promise((r) => setTimeout(r, 350));

export function LoginProvider({ children }: { children: ReactNode }) {
    const [comApple, setComApple] = useState(false);
    const [aberto, setAberto] = useState(false);
    const [sobreModal, setSobreModal] = useState(false);
    const pedido = useRef<Pedido | null>(null);

    useEffect(() => {
        appleDisponivel().then(setComApple);
    }, []);

    const pedirLogin = useCallback(
        (opcoes?: Opcoes) => {
            if (!comApple) return obterIdToken();
            return new Promise<string | null>((resolve, reject) => {
                pedido.current = { resolve, reject };
                setSobreModal(!!opcoes?.sobreModal);
                setAberto(true);
            });
        },
        [comApple],
    );

    const entrarCom = async (obter: () => Promise<string | null>) => {
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

    const folha: Folha = {
        aberto,
        sobreModal,
        entrarComApple: () => entrarCom(obterTokenApple),
        entrarComGoogle: () => entrarCom(obterIdToken),
        cancelar,
    };

    return (
        <LoginContext.Provider value={{ pedirLogin }}>
            <FolhaContext.Provider value={folha}>
                {children}
                <BottomSheet visible={aberto && !sobreModal} onClose={cancelar}>
                    <EscolhaDeLogin {...folha} />
                </BottomSheet>
            </FolhaContext.Provider>
        </LoginContext.Provider>
    );
}

function EscolhaDeLogin({ entrarComApple, entrarComGoogle, cancelar }: Folha) {
    return (
        <>
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
                    onPress={entrarComApple}
                />
                <Pressable
                    onPress={entrarComGoogle}
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
        </>
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
