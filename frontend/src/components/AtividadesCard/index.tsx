import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import type { Atividade } from '../../api/types';
import { colors } from '../../theme';
import GlassCard, { CardLabel } from '../GlassCard';
import styles from './styles';

type Icone = keyof typeof MaterialCommunityIcons.glyphMap;

// desenho de cada atividade (o nome vem da API)
export const ICONES_DE_ATIVIDADE: Record<string, Icone> = {
    surfe: 'surfing',
    remo: 'rowing',
    caiaque: 'kayaking',
    vela: 'sail-boat',
    kitesurfe: 'kitesurfing',
    'voo-livre': 'paragliding',
    natacao: 'swim',
    volei: 'volleyball',
    futevolei: 'soccer',
    frescobol: 'table-tennis',
    trilha: 'hiking',
    escalada: 'carabiner',
    pesca: 'fish',
    barco: 'ferry',
    caminhada: 'walk',
    'por-do-sol': 'weather-sunset',
};

interface Props {
    atividades?: Atividade[];
    /** por que a praia é boa para crianças; sem texto, a linha não aparece */
    criancas?: string | null;
}

/** O que se costuma fazer na praia e, quando faz sentido, se ela é boa para crianças. */
export default function AtividadesCard({ atividades = [], criancas }: Props) {
    if (!atividades.length && !criancas) return null;
    return (
        <GlassCard style={styles.card}>
            {atividades.length ? (
                <>
                    <CardLabel icon={<MaterialCommunityIcons name="run" size={18} color={colors.label} />}>Atividades</CardLabel>
                    <View style={styles.lista} accessibilityRole="list">
                        {atividades.map((a) => (
                            <View key={a.nome} style={styles.chip} accessibilityLabel={a.nome}>
                                <MaterialCommunityIcons
                                    name={ICONES_DE_ATIVIDADE[a.icone] ?? 'run'}
                                    size={17}
                                    color={colors.label}
                                />
                                <Text style={styles.chipTexto}>{a.nome}</Text>
                            </View>
                        ))}
                    </View>
                </>
            ) : null}
            {criancas ? (
                <View style={[styles.criancas, atividades.length ? styles.divisoria : null]} accessible>
                    <View style={styles.criancasIcone}>
                        <MaterialCommunityIcons name="human-male-child" size={20} color={colors.success} />
                    </View>
                    <View style={styles.criancasTextos}>
                        <Text style={styles.criancasTitulo}>Boa para crianças</Text>
                        <Text style={styles.criancasMotivo}>{criancas}</Text>
                    </View>
                </View>
            ) : null}
        </GlassCard>
    );
}
