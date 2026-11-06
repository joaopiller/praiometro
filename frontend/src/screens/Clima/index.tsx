import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Text, View } from 'react-native';
import { getErrorMessage } from '../../api/client';
import DataNotice from '../../components/DataNotice';
import ForecastStrip from '../../components/ForecastStrip';
import Screen from '../../components/Screen';
import SolMare from '../../components/SolMare';
import StateView from '../../components/StateView';
import UVCard from '../../components/UVCard';
import WeatherIcon from '../../components/WeatherIcon';
import { useClima, useRegiao } from '../../hooks/queries';
import { colors, MAX_FONT_SCALE_NUMEROS } from '../../theme';
import { formatTemp, formatUpdated, parseTimestamp } from '../../utils/format';
import { getCondicao } from '../../utils/weather';
import styles from './styles';

export default function Clima() {
    const { data, isPending, error, refetch, isRefetching } = useClima();
    const regiao = useRegiao();

    if (isPending || (error && !data)) {
        return (
            <Screen scroll={false}>
                <StateView loading={isPending} error={error ? getErrorMessage(error) : null} onRetry={() => refetch()} />
            </Screen>
        );
    }

    const leitura = data.leitura_atual ?? {};
    const hora = parseTimestamp(leitura.timestamp)?.hora;
    const condicao = getCondicao(leitura.weather_code);
    const detalhes = [
        leitura.apparent_temperature != null && `Sensação ${formatTemp(leitura.apparent_temperature)}`,
        leitura.relative_humidity_2m != null && `Umidade ${leitura.relative_humidity_2m}%`,
    ].filter(Boolean);

    return (
        <Screen
            refreshing={isRefetching}
            onRefresh={() => {
                refetch();
                regiao.refetch();
            }}
        >
            <View style={styles.hero} accessible accessibilityLabel={`Niterói: ${formatTemp(leitura.temperature_2m)}, ${condicao.descricao}`}>
                <Text style={styles.city}>Niterói, Rio de Janeiro</Text>
                <Text style={styles.temperature} maxFontSizeMultiplier={1.1}>
                    {formatTemp(leitura.temperature_2m)}
                </Text>
                <View style={styles.condicao}>
                    <WeatherIcon code={leitura.weather_code} size={24} hour={hora} />
                    <Text style={styles.condicaoTexto}>{condicao.descricao}</Text>
                </View>
                {detalhes.length ? (
                    <Text style={styles.detalhes} maxFontSizeMultiplier={MAX_FONT_SCALE_NUMEROS}>
                        {detalhes.join('  ·  ')}
                    </Text>
                ) : null}
            </View>

            <DataNotice timestamp={leitura.timestamp} refreshError={!!error} />

            <SolMare regiao={regiao.data} />

            {data.previsao?.length ? <ForecastStrip previsao={data.previsao} /> : null}

            <UVCard uv={leitura.uv_index} />

            <View style={styles.updated}>
                <MaterialCommunityIcons name="update" size={14} color={colors.textMuted} />
                <Text style={styles.updatedText}>Atualizado {formatUpdated(leitura.timestamp)} • Open-Meteo</Text>
            </View>
        </Screen>
    );
}
