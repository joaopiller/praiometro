import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { memo } from 'react';
import { Image, Pressable, Text, View } from 'react-native';
import type { PontoResumo } from '../../api/types';
import { getBeachPhoto } from '../../constants/beaches';
import { colors } from '../../theme';
import { nivelBalneabilidade } from '../../utils/risk';
import Badge from '../Badge';
import styles from './styles';

interface Props {
    ponto: PontoResumo;
    nome: string;
    local: string;
    largura: number;
    selecionado: boolean;
    distancia?: string;
    onAbrir: (codigo: string) => void;
}

function MapBeachCard({ ponto, nome, local, largura, selecionado, distancia, onAbrir }: Props) {
    const nivel = nivelBalneabilidade(ponto.balneabilidade);
    const foto = getBeachPhoto(ponto.codigo);
    return (
        <Pressable
            onPress={() => onAbrir(ponto.codigo)}
            accessibilityRole="button"
            accessibilityLabel={`${nome}${local ? `, ${local}` : ''}. ${nivel.mensagem}. Abrir detalhes`}
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
                    {nome}
                </Text>
                <Text style={styles.local} numberOfLines={1}>
                    {[distancia, local || 'Ponto principal'].filter(Boolean).join(' · ')}
                </Text>
                <Badge label={nivel.rotulo} tone={nivel.tom} claro />
            </View>
            <View style={styles.seta}>
                <Feather name="chevron-right" size={20} color={colors.brand} />
            </View>
        </Pressable>
    );
}

export default memo(MapBeachCard);
