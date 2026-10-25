import { Feather } from '@expo/vector-icons';
import { Image, Pressable, Text, View } from 'react-native';
import type { PontoResumo } from '../../api/types';
import { getBeachPhoto } from '../../constants/beaches';
import { colors } from '../../theme';
import { nivelBalneabilidade } from '../../utils/risk';
import { localEspecifico, nomePrincipal } from '../../utils/search';
import Badge from '../Badge';
import styles from './styles';

interface Props {
    ponto: PontoResumo;
    distancia?: string;
    onPress: () => void;
}

export default function BeachCard({ ponto, distancia, onPress }: Props) {
    const nome = nomePrincipal(ponto);
    const local = localEspecifico(ponto);
    const nivel = nivelBalneabilidade(ponto.balneabilidade);
    const foto = getBeachPhoto(ponto.codigo);
    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={`${nome}${local ? `, ${local}` : ''}. ${nivel.mensagem}`}
            style={({ pressed }) => [styles.card, pressed && styles.pressed]}
        >
            {foto ? (
                <Image source={foto.imagem} style={styles.thumb} />
            ) : (
                <View style={[styles.thumb, styles.thumbPlaceholder]}>
                    <Feather name="map-pin" size={22} color={colors.sand} />
                </View>
            )}
            <View style={styles.texts}>
                <Text style={styles.name} numberOfLines={1}>
                    {nome}
                </Text>
                <Text style={styles.location} numberOfLines={1}>
                    {[distancia, local || 'Ponto principal'].filter(Boolean).join(' · ')}
                </Text>
                <Badge label={nivel.rotulo} tone={nivel.tom} />
            </View>
            <Feather name="chevron-right" size={22} color={colors.textSubtle} />
        </Pressable>
    );
}
