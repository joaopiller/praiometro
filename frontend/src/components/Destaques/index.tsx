import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import type { Destaque } from '../../api/types';
import { colors } from '../../theme';
import styles from './styles';

type Icone = keyof typeof MaterialCommunityIcons.glyphMap;

// Desenho de cada destaque (o nome vem da API). Nenhum repete os ícones que a página da praia
// já usa em outros cartões (ondas, vento, relatos...): o teste do componente garante isso.
export const ICONES: Record<string, Icone> = {
    'mar-forte': 'tsunami',
    surfe: 'surfing',
    trilha: 'hiking',
    escada: 'stairs',
    estacionamento: 'parking',
    'por-do-sol': 'weather-sunset',
    'voo-livre': 'paragliding',
    barca: 'ferry',
    museu: 'bank-outline',
    forte: 'chess-rook',
    navio: 'anchor',
    pesca: 'fish',
    fogos: 'firework',
    montanha: 'image-filter-hdr',
    natureza: 'pine-tree',
    vista: 'binoculars',
    kitesurf: 'kitesurfing',
    familia: 'human-male-child',
    bondinho: 'gondola',
    extensao: 'ruler',
    tubarao: 'shark-fin',
    restaurantes: 'silverware-fork-knife',
    'mar-calmo': 'swim',
    vela: 'sail-boat',
    ilha: 'island',
    calcadao: 'palette-outline',
    farol: 'lighthouse',
    'salva-vidas': 'lifebuoy',
    'mare-alta': 'waves-arrow-up',
    premio: 'medal-outline',
    campeonato: 'trophy-outline',
    enseada: 'palm-tree',
};
export const ICONE_PADRAO: Icone = 'lightbulb-on-outline';

const ROTULOS: Record<Destaque['tipo'], string> = { atencao: 'Atenção', dica: 'Dica', curiosidade: 'Você sabia?' };

function Cartao({ destaque, total = 1, vez = 0 }: { destaque: Destaque; total?: number; vez?: number }) {
    const aviso = destaque.tipo === 'atencao';
    return (
        <View style={[styles.cartao, aviso && styles.cartaoAviso]}>
            <View style={styles.circulo}>
                <MaterialCommunityIcons name={ICONES[destaque.icone] ?? ICONE_PADRAO} size={22} color={colors.bgBottom} />
            </View>
            <View style={styles.textos}>
                <Text style={[styles.rotulo, aviso && styles.rotuloAviso]}>{ROTULOS[destaque.tipo].toUpperCase()}</Text>
                <Text style={styles.texto}>{destaque.texto}</Text>
                {total > 1 ? (
                    <View style={styles.rodape}>
                        <View style={styles.pontos}>
                            {Array.from({ length: total }, (_, i) => (
                                <View key={i} style={[styles.ponto, i === vez && styles.pontoAtivo]} />
                            ))}
                        </View>
                        <Text style={styles.outra}>Toque para ver outra</Text>
                    </View>
                ) : null}
            </View>
        </View>
    );
}

/**
 * O que a praia tem de singular. Os avisos aparecem sempre; dicas e curiosidades ficam
 * num cartão só, uma por vez, começando por uma sorteada a cada visita.
 */
export default function Destaques({ destaques }: { destaques: Destaque[] }) {
    const avisos = destaques.filter((d) => d.tipo === 'atencao');
    const outros = destaques.filter((d) => d.tipo !== 'atencao');
    const [vez, setVez] = useState(() => Math.floor(Math.random() * Math.max(outros.length, 1)));
    if (!destaques.length) return null;
    const atual = outros.length ? outros[vez % outros.length] : null;

    return (
        <View style={styles.lista}>
            {avisos.map((d) => (
                <View key={d.texto} accessible accessibilityLabel={`${ROTULOS.atencao}: ${d.texto}`}>
                    <Cartao destaque={d} />
                </View>
            ))}
            {atual && outros.length === 1 ? (
                <View accessible accessibilityLabel={`${ROTULOS[atual.tipo]}: ${atual.texto}`}>
                    <Cartao destaque={atual} />
                </View>
            ) : null}
            {atual && outros.length > 1 ? (
                <Pressable
                    onPress={() => setVez((v) => (v + 1) % outros.length)}
                    accessibilityRole="button"
                    accessibilityLabel={`${ROTULOS[atual.tipo]}: ${atual.texto}`}
                    accessibilityHint="Toque para ver outra informação sobre a praia"
                    style={({ pressed }) => pressed && styles.pressionado}
                >
                    <Cartao destaque={atual} total={outros.length} vez={vez % outros.length} />
                </Pressable>
            ) : null}
        </View>
    );
}
