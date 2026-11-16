import { Pressable, Text } from 'react-native';
import { CIDADES, ORDEM_CIDADES, type Cidade } from '../../config/cidades';
import Vidro from '../Vidro';
import styles from './styles';

interface Props {
    cidade: Cidade;
    onChange: (cidade: Cidade) => void;
    /** sobre o mapa (fundo claro) ou sobre o azul das telas */
    sobreMapa?: boolean;
}

/** Troca entre as cidades com praias no app. */
export default function CidadeSwitch({ cidade, onChange, sobreMapa }: Props) {
    return (
        <Vidro
            style={styles.caixa}
            semVidro={sobreMapa ? styles.fundoMapa : styles.fundoTela}
            tintColor={sobreMapa ? undefined : 'rgba(1,59,96,0.4)'}
            escuro={!sobreMapa}
            accessibilityRole="radiogroup"
            accessibilityLabel="Cidade"
        >
            {ORDEM_CIDADES.map((c) => {
                const ativa = c === cidade;
                return (
                    <Pressable
                        key={c}
                        onPress={() => onChange(c)}
                        accessibilityRole="radio"
                        accessibilityState={{ selected: ativa }}
                        accessibilityLabel={CIDADES[c].nome}
                        hitSlop={4}
                        style={[styles.opcao, ativa && (sobreMapa ? styles.ativaMapa : styles.ativaTela)]}
                    >
                        <Text
                            style={[
                                styles.texto,
                                sobreMapa ? styles.textoMapa : styles.textoTela,
                                ativa && (sobreMapa ? styles.textoAtivoMapa : styles.textoAtivoTela),
                            ]}
                        >
                            {CIDADES[c].curto}
                        </Text>
                    </Pressable>
                );
            })}
        </Vidro>
    );
}
