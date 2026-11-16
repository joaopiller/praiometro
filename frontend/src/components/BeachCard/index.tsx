import { Feather } from '@expo/vector-icons';
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
    distancia?: string;
    onPress: () => void;
}

export default function BeachCard({ praia, distancia, onPress }: Props) {
    const nivel = nivelPraia(praia.situacao);
    const foto = getBeachPhoto(praia.id);
    const detalhe = [distancia, ondeFica(praia)].filter(Boolean).join(' · ');
    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={`${praia.nome}. ${nivel.mensagem}. ${detalhe}`}
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
                    {praia.nome}
                </Text>
                <Text style={styles.location} numberOfLines={1}>
                    {detalhe}
                </Text>
                <Badge label={nivel.rotulo} tone={nivel.tom} frase />
            </View>
            <Feather name="chevron-right" size={22} color={colors.textSubtle} />
        </Pressable>
    );
}
