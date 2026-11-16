import { useEffect, useState } from 'react';
import { Animated, Easing, type LayoutChangeEvent } from 'react-native';
import { useMovimentoReduzido } from './useMovimentoReduzido';

type Caixa = { x: number; width: number };

/**
 * Marcador que desliza entre opções lado a lado (seletor de cidade, abas do clima).
 * `posicao` vai de um índice ao outro; dela saem o lugar do marcador e a cor de cada texto.
 */
export function useDeslize(indice: number, total: number) {
    const [posicao] = useState(() => new Animated.Value(indice));
    const [caixas, setCaixas] = useState<(Caixa | undefined)[]>([]);
    const semMovimento = useMovimentoReduzido();

    useEffect(() => {
        if (semMovimento) {
            posicao.setValue(indice);
            return;
        }
        const animacao = Animated.timing(posicao, {
            toValue: indice,
            duration: 240,
            easing: Easing.out(Easing.cubic),
            // largura, posição e cor não rodam no driver nativo
            useNativeDriver: false,
        });
        animacao.start();
        return () => animacao.stop();
    }, [indice, posicao, semMovimento]);

    const medir = (i: number) => (e: LayoutChangeEvent) => {
        const { x, width } = e.nativeEvent.layout;
        setCaixas((atuais) => {
            if (atuais[i]?.x === x && atuais[i]?.width === width) return atuais;
            const novas = [...atuais];
            novas[i] = { x, width };
            return novas;
        });
    };

    const indices = Array.from({ length: total }, (_, i) => i);
    const medidas = indices.map((i) => caixas[i]);
    const pronto = total > 1 && medidas.every((c): c is Caixa => !!c);
    /** null até as opções serem medidas: enquanto isso, quem usa mostra a opção ativa sem animação */
    const marcador = pronto
        ? {
              left: posicao.interpolate({ inputRange: indices, outputRange: medidas.map((c) => c.x) }),
              width: posicao.interpolate({ inputRange: indices, outputRange: medidas.map((c) => c.width) }),
          }
        : null;
    /** cor do texto da opção `i`, passando da inativa para a ativa junto com o marcador */
    const cor = (i: number, inativa: string, ativa: string) =>
        posicao.interpolate({ inputRange: indices, outputRange: indices.map((j) => (j === i ? ativa : inativa)) });

    return { marcador, medir, cor };
}
