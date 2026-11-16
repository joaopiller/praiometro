import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Image, Modal, StyleSheet, useWindowDimensions, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { colors, LOGO_ABERTURA_PROPORCAO } from '../../theme';

const logo = require('../../../assets/images/logo-abertura.png');

// mesma largura da logo da abertura nativa (app.config.ts), para a troca não dar salto
const LARGURA_LOGO = 170;
const TEMPO_MINIMO = 1600; // conta a partir de quando a logo aparece
const TEMPO_MAXIMO = 4000;

/** Onda com dois ciclos por largura de tela, desenhada em 2x a largura para rolar sem emenda. */
function caminhoOnda(largura: number, altura: number, amplitude: number): string {
    const periodo = largura / 2;
    let d = `M 0 ${amplitude}`;
    for (let x = 0; x <= largura * 2; x += 8) {
        d += ` L ${x} ${amplitude + Math.sin((x / periodo) * Math.PI * 2) * amplitude}`;
    }
    return `${d} L ${largura * 2} ${altura} L 0 ${altura} Z`;
}

function Onda({ largura, altura, amplitude, cor, duracao, mover }: {
    largura: number;
    altura: number;
    amplitude: number;
    cor: string;
    duracao: number;
    mover: boolean;
}) {
    const [x] = useState(() => new Animated.Value(0));
    const d = useMemo(() => caminhoOnda(largura, altura, amplitude), [largura, altura, amplitude]);

    useEffect(() => {
        if (!mover) return;
        const loop = Animated.loop(
            Animated.timing(x, { toValue: -largura, duration: duracao, easing: Easing.linear, useNativeDriver: true }),
        );
        loop.start();
        return () => loop.stop();
    }, [x, largura, duracao, mover]);

    return (
        <Animated.View style={[styles.onda, { width: largura * 2, height: altura, transform: [{ translateX: x }] }]}>
            <Svg width={largura * 2} height={altura}>
                <Path d={d} fill={cor} />
            </Svg>
        </Animated.View>
    );
}

interface Props {
    /** dados iniciais prontos (cache restaurado) */
    pronto: boolean;
    onFim: () => void;
}

export default function AnimatedSplash({ pronto, onFim }: Props) {
    const { width, height } = useWindowDimensions();
    const [reduzirMovimento, setReduzirMovimento] = useState(false);
    const [tempoMinimo, setTempoMinimo] = useState(false);
    const [tempoEsgotado, setTempoEsgotado] = useState(false);
    const [logoPronta, setLogoPronta] = useState(false);
    const [subida] = useState(() => new Animated.Value(0));
    const [flutuar] = useState(() => new Animated.Value(0));
    const [saida] = useState(() => new Animated.Value(0));
    const saindo = useRef(false);

    useEffect(() => {
        AccessibilityInfo.isReduceMotionEnabled()
            .then(setReduzirMovimento)
            .catch(() => {});
        // se a imagem demorar, não segura a abertura nativa para sempre
        const reserva = setTimeout(() => setLogoPronta(true), 1200);
        // nunca prende o usuário aqui, mesmo se o cache não responder
        const maximo = setTimeout(() => setTempoEsgotado(true), TEMPO_MAXIMO);
        return () => {
            clearTimeout(reserva);
            clearTimeout(maximo);
        };
    }, []);

    // só troca a abertura nativa por esta quando a logo já está desenhada: sem tela vazia no meio
    useEffect(() => {
        if (!logoPronta) return;
        SplashScreen.hideAsync().catch(() => {});
        const minimo = setTimeout(() => setTempoMinimo(true), TEMPO_MINIMO);
        return () => clearTimeout(minimo);
    }, [logoPronta]);

    useEffect(() => {
        if (!logoPronta) return;
        Animated.timing(subida, { toValue: 1, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
        const loop = Animated.loop(
            Animated.sequence([
                Animated.timing(flutuar, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
                Animated.timing(flutuar, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
            ]),
        );
        loop.start();
        return () => loop.stop();
    }, [logoPronta, subida, flutuar]);

    useEffect(() => {
        if (saindo.current || !((tempoMinimo && pronto) || tempoEsgotado)) return;
        saindo.current = true;
        Animated.timing(saida, { toValue: 1, duration: 380, easing: Easing.in(Easing.quad), useNativeDriver: true }).start(
            () => onFim(),
        );
    }, [tempoMinimo, pronto, tempoEsgotado, saida, onFim]);

    const alturaOndas = height * 0.34;
    const deslocamentoOndas = subida.interpolate({ inputRange: [0, 1], outputRange: [alturaOndas, 0] });
    const logoY = flutuar.interpolate({ inputRange: [0, 1], outputRange: [0, reduzirMovimento ? 0 : -6] });
    const escalaSaida = saida.interpolate({ inputRange: [0, 1], outputRange: [1, 1.12] });
    const opacidade = saida.interpolate({ inputRange: [0, 1], outputRange: [1, 0] });

    // Modal: fica numa janela própria, acima de qualquer view nativa (mapa, telas da navegação)
    return (
        <Modal visible transparent animationType="none" statusBarTranslucent onRequestClose={() => {}}>
            <Animated.View
                style={[StyleSheet.absoluteFill, styles.fundo, { opacity: opacidade }]}
                pointerEvents="none"
                accessible
                accessibilityLabel="Praiômetro, carregando"
            >
                <Animated.View style={{ transform: [{ translateY: logoY }, { scale: escalaSaida }] }}>
                    <Image
                        source={logo}
                        style={styles.logo}
                        fadeDuration={0}
                        onLoad={() => setLogoPronta(true)}
                        accessibilityIgnoresInvertColors
                    />
                </Animated.View>
                <Animated.View style={[styles.ondas, { height: alturaOndas, transform: [{ translateY: deslocamentoOndas }] }]}>
                    <Onda largura={width} altura={alturaOndas} amplitude={14} cor="rgba(143,216,255,0.18)" duracao={5200} mover={!reduzirMovimento} />
                    <View style={[StyleSheet.absoluteFill, { top: 26 }]}>
                        <Onda largura={width} altura={alturaOndas} amplitude={11} cor="rgba(143,216,255,0.32)" duracao={3800} mover={!reduzirMovimento} />
                    </View>
                    <View style={[StyleSheet.absoluteFill, { top: 54 }]}>
                        <Onda largura={width} altura={alturaOndas} amplitude={9} cor={colors.bgTop} duracao={2900} mover={!reduzirMovimento} />
                    </View>
                    <View style={[StyleSheet.absoluteFill, { top: alturaOndas - 46 }]}>
                        <Onda largura={width} altura={60} amplitude={6} cor={colors.sand} duracao={9000} mover={!reduzirMovimento} />
                    </View>
                </Animated.View>
            </Animated.View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    fundo: { backgroundColor: colors.brand, alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    logo: { width: LARGURA_LOGO, height: LARGURA_LOGO / LOGO_ABERTURA_PROPORCAO },
    ondas: { position: 'absolute', left: 0, right: 0, bottom: 0, overflow: 'hidden' },
    onda: { position: 'absolute', left: 0, top: 0 },
});
