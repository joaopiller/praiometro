import { Animated, Pressable } from 'react-native';
import { CIDADES, ORDEM_CIDADES, type Cidade } from '../../config/cidades';
import { useDeslize } from '../../hooks/useDeslize';
import { colors, MAX_FONT_SCALE_FIXO } from '../../theme';
import Vidro from '../Vidro';
import styles from './styles';

interface Props {
    cidade: Cidade;
    onChange: (cidade: Cidade) => void;
    /** sobre o mapa (fundo claro) ou sobre o azul das telas */
    sobreMapa?: boolean;
}

/** Troca entre as cidades com praias no app; a marcação desliza de uma para a outra. */
export default function CidadeSwitch({ cidade, onChange, sobreMapa }: Props) {
    const { marcador, medir, cor } = useDeslize(ORDEM_CIDADES.indexOf(cidade), ORDEM_CIDADES.length);
    const fundoAtivo = sobreMapa ? styles.ativaMapa : styles.ativaTela;
    const [inativa, ativa] = sobreMapa ? [colors.brand, '#FFFFFF'] : [colors.textMuted, colors.brand];
    return (
        <Vidro
            style={styles.caixa}
            semVidro={sobreMapa ? styles.fundoMapa : styles.fundoTela}
            tintColor={sobreMapa ? undefined : 'rgba(1,59,96,0.4)'}
            escuro={!sobreMapa}
            accessibilityRole="radiogroup"
            accessibilityLabel="Cidade"
        >
            {marcador && <Animated.View pointerEvents="none" style={[styles.marcador, fundoAtivo, marcador]} />}
            {ORDEM_CIDADES.map((c, i) => {
                const escolhida = c === cidade;
                return (
                    <Pressable
                        key={c}
                        onPress={() => onChange(c)}
                        onLayout={medir(i)}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: escolhida }}
                        accessibilityLabel={CIDADES[c].nome}
                        hitSlop={6}
                        // antes de medir as opções ainda não há marcador para deslizar
                        style={[styles.opcao, escolhida && !marcador && fundoAtivo]}
                    >
                        <Animated.Text
                            maxFontSizeMultiplier={MAX_FONT_SCALE_FIXO}
                            style={[styles.texto, { color: marcador ? cor(i, inativa, ativa) : escolhida ? ativa : inativa }]}
                        >
                            {CIDADES[c].curto}
                        </Animated.Text>
                    </Pressable>
                );
            })}
        </Vidro>
    );
}
