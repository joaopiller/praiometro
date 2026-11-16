import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Animated, Pressable, Text, View } from 'react-native';
import { getErrorMessage } from '../../api/client';
import Aparecer from '../../components/Aparecer';
import DataNotice from '../../components/DataNotice';
import ForecastStrip from '../../components/ForecastStrip';
import Screen from '../../components/Screen';
import SolMare from '../../components/SolMare';
import StateView from '../../components/StateView';
import UVCard from '../../components/UVCard';
import WeatherIcon from '../../components/WeatherIcon';
import CidadeSwitch from '../../components/CidadeSwitch';
import { ZONAS_CLIMA } from '../../config/cidades';
import { useClima, useRegiao } from '../../hooks/queries';
import { useDeslize } from '../../hooks/useDeslize';
import { useCidade, useZonaClima } from '../../hooks/useLugar';
import { usePuxarParaAtualizar } from '../../hooks/usePuxarParaAtualizar';
import { colors, MAX_FONT_SCALE_NUMEROS } from '../../theme';
import { formatTemp, formatUpdated, parseTimestamp } from '../../utils/format';
import { getCondicao } from '../../utils/weather';
import styles from './styles';

export default function Clima() {
    const [cidade, setCidade] = useCidade();
    const [zona, setZona] = useZonaClima();
    const { data, isPending, error, refetch } = useClima(zona);
    const regiao = useRegiao();
    const [puxando, puxar] = usePuxarParaAtualizar(() => Promise.all([refetch(), regiao.refetch()]));

    const zonas = ZONAS_CLIMA.filter((z) => z.cidade === cidade);
    // o traço embaixo da área escolhida desliza de uma para a outra
    const deslize = useDeslize(
        zonas.findIndex((z) => z.id === zona),
        zonas.length,
    );

    const seletores = (
        <>
            <CidadeSwitch cidade={cidade} onChange={setCidade} />
            <View style={styles.zonas} accessibilityRole="radiogroup">
                {zonas.map((z, i) => {
                    const ativa = z.id === zona;
                    const cor = deslize.marcador
                        ? deslize.cor(i, colors.textMuted, colors.text)
                        : ativa
                          ? colors.text
                          : colors.textMuted;
                    return (
                        <Pressable
                            key={z.id}
                            onPress={() => setZona(z.id)}
                            onLayout={deslize.medir(i)}
                            accessibilityRole="radio"
                            accessibilityState={{ selected: ativa }}
                            hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                            style={[styles.zona, ativa && !deslize.marcador && styles.zonaAtiva]}
                        >
                            <Animated.Text style={[styles.zonaTexto, { color: cor }]}>{z.rotulo}</Animated.Text>
                        </Pressable>
                    );
                })}
                {deslize.marcador && <Animated.View pointerEvents="none" style={[styles.zonaTraco, deslize.marcador]} />}
            </View>
        </>
    );

    // carregando ou com erro, a troca de cidade e de área continua à mão:
    // quem caiu numa área que falhou consegue voltar para a outra
    if (!data) {
        return (
            <Screen scroll={false}>
                <View style={[styles.hero, styles.heroSozinho]}>{seletores}</View>
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
        <Screen refreshing={puxando} onRefresh={puxar}>
            <View style={styles.hero}>
                {seletores}
                {/* ao trocar de cidade ou de área, os números novos entram de leve em vez de piscar */}
                <Aparecer chave={zona} style={styles.agora}>
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
                </Aparecer>
            </View>

            <Aparecer chave={zona} style={styles.cartoes}>
                <DataNotice timestamp={leitura.timestamp} refreshError={!!error} />

                <SolMare regiao={regiao.data} />

                {data.previsao?.length ? <ForecastStrip previsao={data.previsao} /> : null}

                <UVCard uv={leitura.uv_index} />

                <View style={styles.updated}>
                    <MaterialCommunityIcons name="update" size={14} color={colors.textMuted} />
                    <Text style={styles.updatedText}>
                        {leitura.timestamp ? `Atualizado ${formatUpdated(leitura.timestamp)}` : 'Sem dados recentes'} • Open-Meteo
                    </Text>
                </View>
            </Aparecer>
        </Screen>
    );
}
