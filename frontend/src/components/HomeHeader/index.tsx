import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Image, Pressable, Text, View } from 'react-native';
import { useClima } from '../../hooks/queries';
import { CIDADES } from '../../config/cidades';
import { useCidade, useZonaClima } from '../../hooks/useLugar';
import { formatTemp, parseTimestamp } from '../../utils/format';
import { getCondicao } from '../../utils/weather';
import { colors } from '../../theme';
import Vidro, { temVidro } from '../Vidro';
import WeatherIcon from '../WeatherIcon';
import styles from './styles';

const logo = require('../../../assets/images/logo-header.png');

export default function HomeHeader({ onPress }: { onPress?: () => void }) {
    const [zona] = useZonaClima();
    const [cidade] = useCidade();
    const { data, isPending } = useClima(zona);
    const leitura = data?.leitura_atual;
    const condicao = getCondicao(leitura?.weather_code);

    const conteudo = (
        <>
            <Image source={logo} style={styles.logo} accessibilityLabel="Praiômetro" />
            <Pressable
                onPress={onPress}
                style={({ pressed }) => [styles.clima, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel={
                    leitura ? `${CIDADES[cidade].curto} agora: ${formatTemp(leitura.temperature_2m)}, ${condicao.descricao}. Ver previsão` : 'Ver clima'
                }
            >
                {leitura ? (
                    <>
                        <WeatherIcon code={leitura.weather_code} size={28} hour={parseTimestamp(leitura.timestamp)?.hora} />
                        <View style={styles.climaTexto}>
                            <Text style={styles.temp}>{formatTemp(leitura.temperature_2m)}</Text>
                            <Text style={styles.condicao} numberOfLines={1}>
                                {condicao.descricao}
                            </Text>
                        </View>
                    </>
                ) : (
                    <Text style={[styles.condicao, styles.climaTexto]}>{isPending ? '...' : 'Clima'}</Text>
                )}
                <Feather name="chevron-right" size={16} color="rgba(255,255,255,0.7)" />
            </Pressable>
        </>
    );

    // no iOS 26 a barra vira vidro tingido com o azul da marca, deixando o mapa aparecer por trás
    if (temVidro) {
        return (
            <Vidro style={[styles.bar, styles.barVidro]} tintColor={colors.vidroMarca}>
                {conteudo}
            </Vidro>
        );
    }
    return (
        <LinearGradient colors={[colors.headerTop, colors.bgTop]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.bar}>
            {conteudo}
        </LinearGradient>
    );
}
