import { Feather, FontAwesome5, MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useState } from 'react';
import { ActivityIndicator, ImageBackground, Linking, Pressable, Text, View } from 'react-native';
import { getErrorMessage } from '../../api/client';
import type { PraiaDetalhe } from '../../api/types';
import { useAviso } from '../../components/Aviso';
import DataNotice from '../../components/DataNotice';
import Destaques from '../../components/Destaques';
import FeedbackModal from '../../components/FeedbackModal';
import FeedbackSection from '../../components/FeedbackSection';
import GlassCard from '../../components/GlassCard';
import HistoricoStrip from '../../components/HistoricoStrip';
import MetricCard from '../../components/MetricCard';
import RelatosCard from '../../components/RelatosCard';
import Screen from '../../components/Screen';
import StateView from '../../components/StateView';
import StatusBanner from '../../components/StatusBanner';
import TrechosCard from '../../components/TrechosCard';
import WaveDivider from '../../components/WaveDivider';
import { getBeachPhoto } from '../../constants/beaches';
import { useAvaliacao, useHistorico, usePraia, usePraias, useRelatos } from '../../hooks/queries';
import { usePuxarParaAtualizar } from '../../hooks/usePuxarParaAtualizar';
import type { PraiasScreenProps } from '../../navigation/types';
import { colors } from '../../theme';
import { descreverBoletim, formatNumber, formatTemp } from '../../utils/format';
import { direcaoVento, NIVEL_BAIA, nivelOnda, nivelPraia, nivelVento } from '../../utils/risk';
import { nomeDoTrecho } from '../../utils/search';
import styles from './styles';

const ICONE_BALNEABILIDADE = { success: 'check-circle', danger: 'close-circle', neutral: 'help-circle', warning: 'alert-circle' } as const;

export default function Praia({ route, navigation }: PraiasScreenProps<'Praia'>) {
    const { id, trecho, doMapa } = route.params;
    const consulta = usePraia(id);
    // enquanto os detalhes não chegam (servidor voltando do repouso, rede ruim), a página abre
    // com o que a lista já tem: nome, situação do banho e trechos
    const resumo = usePraias().data?.find((p) => p.id === id);
    const praia: PraiaDetalhe | undefined = consulta.data ?? resumo;
    const soResumo = !consulta.data;
    const avaliacao = useAvaliacao(id);
    const relatos = useRelatos(id);
    const [escolhido, setEscolhido] = useState(trecho);
    // histórico do trecho tocado (ou do que veio do mapa); sem escolha, o ponto principal
    const pontos = praia?.pontos ?? [];
    const trechoAtual = pontos.find((p) => p.codigo === escolhido) ?? pontos.find((p) => p.codigo === praia?.principal);
    const historico = useHistorico(trechoAtual?.codigo ?? '');
    const [puxando, puxar] = usePuxarParaAtualizar(() =>
        Promise.all([consulta.refetch(), avaliacao.refetch(), historico.refetch(), relatos.refetch()]),
    );
    const [modalVisivel, setModalVisivel] = useState(false);
    const avisar = useAviso();

    if (!praia) {
        return (
            <Screen scroll={false}>
                <StateView
                    loading={consulta.isPending}
                    error={consulta.error ? getErrorMessage(consulta.error) : null}
                    onRetry={() => consulta.refetch()}
                />
            </Screen>
        );
    }

    const leitura = praia.leitura_atual ?? {};
    const nome = praia.nome;
    const foto = getBeachPhoto(id);
    const balneabilidade = nivelPraia(praia.situacao);
    const variosTrechos = praia.pontos.length > 1;
    const boletim = descreverBoletim(praia.balneabilidade_data);
    const baia = praia.mar === 'baia';
    const onda = baia ? NIVEL_BAIA : nivelOnda(leitura.wave_height);
    const vento = nivelVento(leitura.wind_speed_10m);

    // quem abriu a praia pelo mapa volta para o mapa, não para a lista
    const voltar = () => {
        if (!doMapa) return navigation.goBack();
        if (navigation.getState().index > 0) navigation.popToTop();
        navigation.navigate('Home');
    };

    const coords = praia.centro;
    async function abrirMapa() {
        if (!coords) return;
        const url = `https://www.google.com/maps/dir/?api=1&destination=${coords[0]},${coords[1]}`;
        try {
            await Linking.openURL(url);
        } catch {
            avisar('Não foi possível abrir o mapa. Verifique se há um app de mapas instalado.', 'erro');
        }
    }

    return (
        <Screen
            refreshing={puxando}
            onRefresh={puxar}
            contentStyle={styles.content}
        >
            <ImageBackground source={foto?.imagem} style={styles.hero} resizeMode="cover" accessibilityIgnoresInvertColors>
                {/* a foto fica limpa; só a base escurece, para o nome da praia ler bem em qualquer imagem */}
                <LinearGradient
                    colors={['transparent', 'transparent', 'rgba(0,26,46,0.68)']}
                    locations={[0, 0.42, 1]}
                    style={styles.heroShade}
                />
                <Pressable
                    onPress={voltar}
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
                </View>
                <View style={styles.wave}>
                    <WaveDivider color={colors.bgTop} />
                </View>
            </ImageBackground>

            <View style={styles.body}>
                {soResumo && !consulta.error ? null : (
                    <DataNotice timestamp={leitura.timestamp ?? praia.ultima_leitura} refreshError={!!consulta.error} />
                )}

                <StatusBanner
                    tone={balneabilidade.tom}
                    icon={ICONE_BALNEABILIDADE[balneabilidade.tom]}
                    // na parcial o título fica curto, numa linha só; o "para banho" e a conta dos trechos vão embaixo
                    title={(praia.situacao === 'parcial' ? balneabilidade.rotulo : balneabilidade.mensagem) ?? ''}
                    subtitle={
                        praia.situacao === 'parcial'
                            ? `Própria para banho em ${praia.pontos_proprios} de ${praia.pontos_com_dados} trechos\n${boletim}`
                            : boletim
                    }
                />

                <Destaques key={praia.id} destaques={praia.destaques ?? []} />

                {variosTrechos && trechoAtual ? (
                    <TrechosCard pontos={praia.pontos} selecionado={trechoAtual.codigo} onSelecionar={setEscolhido} />
                ) : null}

                <HistoricoStrip
                    historico={historico.data}
                    carregando={historico.isLoading}
                    trecho={variosTrechos && trechoAtual ? nomeDoTrecho(trechoAtual) : undefined}
                />

                <RelatosCard codigo={id} />

                {leitura.choveu_8_horas && (
                    <View style={styles.rainAlert} accessibilityRole="alert">
                        <MaterialCommunityIcons name="weather-pouring" size={22} color={colors.warning} />
                        <Text style={styles.rainText}>
                            Choveu nas últimas horas. A chuva leva esgoto ao mar: evite o banho por até 24h.
                        </Text>
                    </View>
                )}

                {soResumo && !consulta.error ? (
                    <View style={styles.carregando} accessibilityLiveRegion="polite">
                        <ActivityIndicator color={colors.textMuted} />
                        <Text style={styles.carregandoTexto}>Carregando ondas, vento e temperatura da água...</Text>
                    </View>
                ) : null}

                {soResumo ? null : (
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
                )}

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
