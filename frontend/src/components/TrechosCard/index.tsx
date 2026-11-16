import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import type { PontoDaPraia } from '../../api/types';
import { colors, toneColors } from '../../theme';
import { nivelBalneabilidade } from '../../utils/risk';
import { nomeDoTrecho } from '../../utils/search';
import GlassCard, { CardLabel } from '../GlassCard';
import styles from './styles';

interface Props {
    pontos: PontoDaPraia[];
    selecionado: string;
    onSelecionar: (codigo: string) => void;
}

/** Trechos da praia onde o INEA mede a água, cada um com a sua situação. */
export default function TrechosCard({ pontos, selecionado, onSelecionar }: Props) {
    return (
        <GlassCard style={styles.card}>
            <CardLabel icon={<MaterialCommunityIcons name="map-marker-multiple-outline" size={18} color={colors.label} />}>
                Banho por trecho
            </CardLabel>
            <Text style={styles.ajuda}>
                O INEA mede a qualidade da água em {pontos.length} trechos desta praia. Toque para ver o histórico de cada um.
            </Text>
            <View accessibilityRole="radiogroup">
                {pontos.map((p, i) => {
                    const nivel = nivelBalneabilidade(p.balneabilidade);
                    const tom = toneColors[nivel.tom];
                    const ativo = p.codigo === selecionado;
                    return (
                        <Pressable
                            key={p.codigo}
                            onPress={() => onSelecionar(p.codigo)}
                            accessibilityRole="radio"
                            accessibilityState={{ selected: ativo }}
                            accessibilityLabel={`${nomeDoTrecho(p)}: ${nivel.mensagem}`}
                            style={({ pressed }) => [
                                styles.linha,
                                i > 0 && styles.divisoria,
                                ativo && styles.ativa,
                                pressed && styles.pressionada,
                            ]}
                        >
                            <View style={[styles.ponto, { backgroundColor: tom.solid }]} />
                            <Text style={[styles.nome, ativo && styles.nomeAtivo]} numberOfLines={2}>
                                {nomeDoTrecho(p)}
                            </Text>
                            <Text style={[styles.situacao, { color: tom.fg }]}>{nivel.rotulo}</Text>
                        </Pressable>
                    );
                })}
            </View>
        </GlassCard>
    );
}
