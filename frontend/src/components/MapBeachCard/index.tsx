import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { memo } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import type { PraiaResumo } from '../../api/types';
import { getBeachPhoto } from '../../constants/beaches';
import { colors } from '../../theme';
import { nivelPraia } from '../../utils/risk';
import { ondeFica } from '../../utils/trechos';
import Badge from '../Badge';
import styles from './styles';

interface Props {
    praia: PraiaResumo;
    largura: number;
    selecionado: boolean;
    distancia?: string;
    onAbrir: (id: string) => void;
}

function MapBeachCard({ praia, largura, selecionado, distancia, onAbrir }: Props) {
    const nivel = nivelPraia(praia.situacao);
    const foto = getBeachPhoto(praia.id);
    const detalhe = [distancia, ondeFica(praia)].filter(Boolean).join(' · ');
    return (
        <Pressable
            onPress={() => onAbrir(praia.id)}
            accessibilityRole="button"
            accessibilityLabel={`${praia.nome}. ${nivel.mensagem}. ${detalhe}. Abrir detalhes`}
            accessibilityState={{ selected: selecionado }}
            style={({ pressed }) => [styles.card, { width: largura }, pressed && styles.pressed]}
        >
            {foto ? (
                <Image source={foto.imagem} style={styles.foto} />
            ) : (
                <View style={[styles.foto, styles.semFoto]}>
                    <MaterialCommunityIcons name="beach" size={30} color={colors.brand} />
                </View>
            )}
            <View style={styles.textos}>
                <Text style={styles.nome} numberOfLines={1}>
                    {praia.nome}
                </Text>
                <Text style={styles.local} numberOfLines={1}>
                    {detalhe}
                </Text>
                <Badge label={nivel.rotulo} tone={nivel.tom} claro frase />
            </View>
            <View style={styles.seta}>
                <Feather name="chevron-right" size={20} color={colors.brand} />
            </View>
        </Pressable>
    );
}

export default memo(MapBeachCard);
