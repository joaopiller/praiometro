import { Feather, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { ImageBackground, Linking, Pressable, Text, View } from 'react-native';
import { getErrorMessage } from '../../api/client';
import { useAviso } from '../../components/Aviso';
import DataNotice from '../../components/DataNotice';
import FeedbackModal from '../../components/FeedbackModal';
import FeedbackSection from '../../components/FeedbackSection';
import GlassCard from '../../components/GlassCard';
import HistoricoStrip from '../../components/HistoricoStrip';
import MetricCard from '../../components/MetricCard';
import RelatosCard from '../../components/RelatosCard';
import Screen from '../../components/Screen';
import StateView from '../../components/StateView';
import StatusBanner from '../../components/StatusBanner';
import WaveDivider from '../../components/WaveDivider';
import { getBeachPhoto } from '../../constants/beaches';
import { useAvaliacao, useHistorico, usePonto, useRelatos } from '../../hooks/queries';
import type { PraiasScreenProps } from '../../navigation/types';
import { colors } from '../../theme';
import { descreverBoletim, formatNumber, formatTemp } from '../../utils/format';
import { direcaoVento, NIVEL_BAIA, nivelBalneabilidade, nivelOnda, nivelVento } from '../../utils/risk';
import styles from './styles';

const ICONE_BALNEABILIDADE = { success: 'check-circle', danger: 'close-circle', neutral: 'help-circle', warning: 'alert-circle' } as const;

export default function Praia({ route, navigation }: PraiasScreenProps<'Praia'>) {
    const { id } = route.params;
    const ponto = usePonto(id);
    const avaliacao = useAvaliacao(id);
    const historico = useHistorico(id);
    const relatos = useRelatos(id);
    const [modalVisivel, setModalVisivel] = useState(false);
    const avisar = useAviso();

    if (ponto.isPending || (ponto.error && !ponto.data)) {
        return (
            <Screen scroll={false}>
                <StateView
                    loading={ponto.isPending}
                    error={ponto.error ? getErrorMessage(ponto.error) : null}
                    onRetry={() => ponto.refetch()}
                />
            </Screen>
        );
    }

    const praia = ponto.data;
    const leitura = praia.leitura_atual ?? {};
    const nome = praia.nome?.[0] ?? 'Praia';
    const local = praia.specific_location?.find((l) => l.trim());
    const foto = getBeachPhoto(id);
    const balneabilidade = nivelBalneabilidade(leitura.balneabilidade);
    const baia = praia.mar === 'baia';
    const onda = baia ? NIVEL_BAIA : nivelOnda(leitura.wave_height);
    const vento = nivelVento(leitura.wind_speed_10m);

    async function abrirMapa() {
        const coords = praia.coordenadas_terra_decimais;
        if (!coords) return;
        const url = `https://www.google.com/maps/search/?api=1&query=${coords[0]},${coords[1]}`;
        try {
            await Linking.openURL(url);
        } catch {
            avisar('Não foi possível abrir o mapa. Verifique se há um app de mapas instalado.', 'erro');
        }
    }

    return (
        <Screen
            refreshing={ponto.isRefetching}
            onRefresh={() => {
                ponto.refetch();
                avaliacao.refetch();
                historico.refetch();
                relatos.refetch();
            }}
            contentStyle={styles.content}
        >
            <ImageBackground source={foto?.imagem} style={styles.hero} resizeMode="cover" accessibilityIgnoresInvertColors>
                {/* o topo parte da mesma cor em que o cabeçalho termina, então a foto "nasce" dele */}
                <LinearGradient
                    colors={[colors.bgTop, 'rgba(10,99,158,0.55)', 'rgba(10,99,158,0)', 'transparent', 'rgba(1,84,134,0.65)']}
                    locations={[0, 0.16, 0.42, 0.62, 1]}
                    style={styles.heroShade}
                />
                <Pressable
                    onPress={() => navigation.goBack()}
                    style={styles.back}
                    accessibilityRole="button"
                    accessibilityLabel="Voltar"
                    hitSlop={10}
                >
                    <Feather name="arrow-left" size={22} color="#fff" />
                </Pressable>
                <View style={styles.heroText}>
                    <Text style={styles.title} accessibilityRole="header">
                        {nome}
                    </Text>
                    {local ? <Text style={styles.subtitle}>{local}</Text> : null}
                </View>
                <View style={styles.wave}>
                    <WaveDivider color={colors.bgTop} />
                </View>
            </ImageBackground>

            <View style={styles.body}>
                <DataNotice timestamp={leitura.timestamp} refreshError={!!ponto.error} />

                <StatusBanner
                    tone={balneabilidade.tom}
                    icon={ICONE_BALNEABILIDADE[balneabilidade.tom]}
                    title={balneabilidade.mensagem ?? ''}
                    subtitle={descreverBoletim(leitura.balneabilidade_data)}
                />

                <HistoricoStrip historico={historico.data} />

                <RelatosCard codigo={id} />

                {leitura.choveu_8_horas && (
                    <View style={styles.rainAlert} accessibilityRole="alert">
                        <MaterialCommunityIcons name="weather-pouring" size={22} color={colors.warning} />
                        <Text style={styles.rainText}>
                            Choveu nas últimas horas. A chuva leva esgoto ao mar: evite o banho por até 24h.
                        </Text>
                    </View>
                )}

                <View style={styles.grid}>
                    <MetricCard
                        label="Ondas"
                        icon={<MaterialCommunityIcons name="waves" size={28} color={colors.label} />}
                        nivel={onda}
                        value={formatNumber(leitura.wave_height)}
                        unit="m"
                        nota={baia ? 'Águas abrigadas' : undefined}
                        footer={
                            baia
                                ? 'Sem previsão de ondas confiável dentro da baía'
                                : leitura.wave_period != null
                                  ? `${formatNumber(leitura.wave_period)}s de período`
                                  : null
                        }
                        footerIcon={baia ? undefined : <Feather name="clock" size={14} color={colors.textMuted} />}
                    />
                    <MetricCard
                        label="Vento"
                        icon={<MaterialCommunityIcons name="weather-windy" size={28} color={colors.label} />}
                        nivel={vento}
                        value={formatNumber(leitura.wind_speed_10m)}
                        unit="km/h"
                        footer={direcaoVento(leitura.wind_direction_10m)}
                        footerIcon={
                            leitura.wind_direction_10m != null ? (
                                <Feather
                                    name="navigation"
                                    size={14}
                                    color={colors.textMuted}
                                    // seta aponta para onde o vento vai
                                    style={{ transform: [{ rotate: `${(leitura.wind_direction_10m + 180 - 45) % 360}deg` }] }}
                                />
                            ) : undefined
                        }
                    />
                </View>

                {leitura.sea_surface_temperature != null && (
                    <GlassCard
                        style={styles.agua}
                        accessibilityLabel={`Temperatura da água: ${formatTemp(leitura.sea_surface_temperature)}`}
                    >
                        <MaterialCommunityIcons name="coolant-temperature" size={26} color={colors.label} />
                        <View style={styles.aguaTextos}>
                            <Text style={styles.aguaLabel}>TEMPERATURA DA ÁGUA</Text>
                            {baia ? <Text style={styles.aguaNota}>Estimativa regional</Text> : null}
                        </View>
                        <Text style={styles.aguaValor}>{formatTemp(leitura.sea_surface_temperature)}</Text>
                    </GlassCard>
                )}

                <FeedbackSection
                    avaliacao={avaliacao.data}
                    loading={avaliacao.isPending}
                    error={!!avaliacao.error && !avaliacao.data}
                    onRetry={() => avaliacao.refetch()}
                    onPress={() => setModalVisivel(true)}
                />

                <Pressable
                    onPress={abrirMapa}
                    accessibilityRole="link"
                    style={({ pressed }) => [styles.mapsButton, pressed && styles.pressed]}
                >
                    <FontAwesome5 name="map-marked-alt" size={18} color={colors.text} />
                    <Text style={styles.mapsText}>Como chegar</Text>
                </Pressable>

                {foto ? <Text style={styles.credit}>Foto: {foto.credito}</Text> : null}
            </View>

            <FeedbackModal visible={modalVisivel} onClose={() => setModalVisivel(false)} beachName={nome} beachId={id} />
        </Screen>
    );
}
