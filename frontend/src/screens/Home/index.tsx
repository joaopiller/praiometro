import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Camera, GeoJSONSource, Images, Layer, Map, UserLocation, type CameraRef } from '@maplibre/maplibre-react-native';
import { useIsFocused } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, useWindowDimensions, View, type ListViewToken } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getErrorMessage } from '../../api/client';
import type { PraiaResumo } from '../../api/types';
import { useAviso } from '../../components/Aviso';
import HomeHeader from '../../components/HomeHeader';
import MapBeachCard from '../../components/MapBeachCard';
import Screen from '../../components/Screen';
import StateView from '../../components/StateView';
import Vidro from '../../components/Vidro';
import { MAPA_INICIAL } from '../../constants/beaches';
import { usePraias } from '../../hooks/queries';
import { useLocalizacao } from '../../hooks/useLocalizacao';
import type { TabScreenProps } from '../../navigation/types';
import { useEspacoDasAbas } from '../../navigation/useEspacoDasAbas';
import { colors, toneColors } from '../../theme';
import { centroDaPraia, distanciaAtePraia, formatDistancia, ordenarPraiasPorDistancia } from '../../utils/geo';
import { nomeCurto } from '../../utils/search';
import styles, { CARD_GAP, CARROSSEL_ALTURA } from './styles';

const PINS = {
    propria: require('../../../assets/images/pins/pin-propria.png'),
    impropria: require('../../../assets/images/pins/pin-impropria.png'),
    parcial: require('../../../assets/images/pins/pin-parcial.png'),
    'sem-dados': require('../../../assets/images/pins/pin-sem-dados.png'),
    'propria-sel': require('../../../assets/images/pins/pin-propria-sel.png'),
    'impropria-sel': require('../../../assets/images/pins/pin-impropria-sel.png'),
    'parcial-sel': require('../../../assets/images/pins/pin-parcial-sel.png'),
    'sem-dados-sel': require('../../../assets/images/pins/pin-sem-dados-sel.png'),
};

const PIN_DA_SITUACAO = { propria: 'propria', impropria: 'impropria', parcial: 'parcial', sem_dados: 'sem-dados' } as const;
const COR_DO_TRECHO = (b: boolean | null) => toneColors[b === true ? 'success' : b === false ? 'danger' : 'neutral'].solid;

const VISIBILIDADE = { itemVisiblePercentThreshold: 70 };

export default function Home({ navigation }: TabScreenProps<'Home'>) {
    const { data, isPending, error, refetch } = usePraias();
    const insets = useSafeAreaInsets();
    const focado = useIsFocused();
    const { width } = useWindowDimensions();
    const camera = useRef<CameraRef>(null);
    const lista = useRef<FlatList<PraiaResumo>>(null);
    const [selecionado, setSelecionado] = useState<string | null>(null);
    const [mapaFalhou, setMapaFalhou] = useState(false);
    const base = useEspacoDasAbas();
    const { coordenada: origem, carregando: localizando, localizar } = useLocalizacao();
    const avisar = useAviso();

    const cardLargura = Math.min(width - 56, 380);

    // na ordem do litoral: cada card do carrossel é vizinho do anterior
    const praias = useMemo(
        () => (data ?? []).filter((p) => centroDaPraia(p)).sort((a, b) => a.ordem - b.ordem),
        [data],
    );

    // um pin por praia, no meio da areia
    const pins = useMemo<GeoJSON.FeatureCollection>(
        () => ({
            type: 'FeatureCollection',
            features: praias.map((p) => {
                const c = centroDaPraia(p)!;
                return {
                    type: 'Feature',
                    id: p.id,
                    geometry: { type: 'Point', coordinates: [c.longitude, c.latitude] },
                    properties: { id: p.id, nome: nomeCurto(p.nome), status: PIN_DA_SITUACAO[p.situacao] },
                };
            }),
        }),
        [praias],
    );

    // os trechos medidos aparecem, pequenos, só na praia escolhida
    const trechos = useMemo<GeoJSON.FeatureCollection>(() => {
        const praia = praias.find((p) => p.id === selecionado);
        return {
            type: 'FeatureCollection',
            features: (praia && praia.pontos.length > 1 ? praia.pontos : []).flatMap((t) => {
                const c = t.coordenadas_terra ?? t.coordenadas;
                return c
                    ? [
                          {
                              type: 'Feature' as const,
                              id: t.codigo,
                              geometry: { type: 'Point' as const, coordinates: [c[1], c[0]] },
                              properties: { cor: COR_DO_TRECHO(t.balneabilidade) },
                          },
                      ]
                    : [];
            }),
        };
    }, [praias, selecionado]);

    const focar = useCallback(
        (id: string, rolarLista: boolean) => {
            const indice = praias.findIndex((p) => p.id === id);
            if (indice < 0) return;
            const praia = praias[indice];
            setSelecionado(id);
            const padding = { bottom: base + CARROSSEL_ALTURA + 24, top: insets.top + 110, left: 40, right: 84 };
            const lugares = [centroDaPraia(praia)!, ...praia.pontos.flatMap((t) => {
                const c = t.coordenadas_terra ?? t.coordenadas;
                return c ? [{ latitude: c[0], longitude: c[1] }] : [];
            })];
            if (lugares.length > 2) {
                // praia com vários trechos: enquadra todos
                const lons = lugares.map((l) => l.longitude);
                const lats = lugares.map((l) => l.latitude);
                camera.current?.fitBounds([Math.min(...lons), Math.min(...lats), Math.max(...lons), Math.max(...lats)], {
                    padding,
                    duration: 700,
                });
            } else {
                const c = lugares[0];
                camera.current?.flyTo({ center: [c.longitude, c.latitude], zoom: 14.5, duration: 700, padding });
            }
            if (rolarLista) lista.current?.scrollToOffset({ offset: indice * (cardLargura + CARD_GAP), animated: true });
        },
        [praias, cardLargura, base, insets.top],
    );

    const irParaMaisProxima = async () => {
        const r = await localizar();
        if ('erro' in r) {
            avisar(r.erro, 'erro');
            return;
        }
        const [maisProxima] = ordenarPraiasPorDistancia(praias, r.coordenada);
        if (maisProxima) focar(maisProxima.praia.id, true);
    };

    const abrirPraia = useCallback(
        (id: string) => navigation.navigate('PraiasTab', { screen: 'Praia', params: { id } }),
        [navigation],
    );

    // cards memorizados: mudar a seleção só redesenha os dois cards afetados
    const renderCard = useCallback(
        ({ item }: { item: PraiaResumo }) => {
            const km = origem ? distanciaAtePraia(item, origem) : null;
            return (
                <MapBeachCard
                    praia={item}
                    largura={cardLargura}
                    selecionado={item.id === selecionado}
                    distancia={km !== null ? formatDistancia(km) : undefined}
                    onAbrir={abrirPraia}
                />
            );
        },
        [origem, cardLargura, selecionado, abrirPraia],
    );

    const recentralizar = () => {
        setSelecionado(null);
        camera.current?.easeTo({ center: MAPA_INICIAL.centro, zoom: MAPA_INICIAL.zoom, duration: 700, padding: { top: 0, right: 0, bottom: 0, left: 0 } });
    };

    const arrastando = useRef(false);
    const focarRef = useRef(focar);
    useEffect(() => {
        focarRef.current = focar;
    }, [focar]);
    // a FlatList não aceita trocar onViewableItemsChanged depois de montada
    const [aoMudarCard] = useState(() => ({ viewableItems }: { viewableItems: ListViewToken[] }) => {
        const atual: PraiaResumo | undefined = viewableItems.find((v) => v.isViewable)?.item;
        if (atual && arrastando.current) focarRef.current(atual.id, false);
    });

    if (isPending || (error && !data)) {
        return (
            <Screen scroll={false}>
                <StateView loading={isPending} error={error ? getErrorMessage(error) : null} onRetry={() => refetch()} />
            </Screen>
        );
    }

    return (
        <View style={styles.container}>
            <Map
                style={styles.map}
                mapStyle="https://tiles.openfreemap.org/styles/liberty"
                logo={false}
                compass={false}
                attributionPosition={{ bottom: base + CARROSSEL_ALTURA + 4, left: 8 }}
                onDidFailLoadingMap={() => setMapaFalhou(true)}
                onDidFinishLoadingMap={() => setMapaFalhou(false)}
                onPress={() => setSelecionado(null)}
            >
                <Camera
                    ref={camera}
                    initialViewState={{ center: MAPA_INICIAL.centro, zoom: MAPA_INICIAL.zoom }}
                    minZoom={9}
                    maxZoom={17}
                />
                <Images images={PINS} />
                {origem && <UserLocation animated />}
                <GeoJSONSource id="trechos" data={trechos}>
                    <Layer
                        type="circle"
                        id="trechos-ponto"
                        paint={{
                            'circle-radius': 7,
                            'circle-color': ['get', 'cor'],
                            'circle-stroke-color': '#ffffff',
                            'circle-stroke-width': 2.5,
                        }}
                    />
                </GeoJSONSource>
                <GeoJSONSource
                    id="praias"
                    data={pins}
                    onPress={(e) => {
                        const id = e.nativeEvent.features[0]?.properties?.id;
                        if (id) focar(id, true);
                    }}
                    hitbox={{ top: 18, right: 18, bottom: 18, left: 18 }}
                >
                    <Layer
                        type="symbol"
                        id="praias-pin"
                        filter={['!=', ['get', 'id'], selecionado ?? '']}
                        layout={{
                            'icon-image': ['get', 'status'],
                            'icon-anchor': 'bottom',
                            'icon-allow-overlap': true,
                            'icon-size': ['interpolate', ['linear'], ['zoom'], 10, 0.32, 13, 0.38, 16, 0.46],
                        }}
                    />
                    <Layer
                        type="symbol"
                        id="praias-nome"
                        minzoom={11.8}
                        filter={['!=', ['get', 'id'], selecionado ?? '']}
                        layout={{
                            'text-field': ['get', 'nome'],
                            'text-font': ['Noto Sans Bold'],
                            'text-size': 12,
                            'text-anchor': 'top',
                            'text-offset': [0, 0.3],
                            'text-optional': true,
                        }}
                        paint={{ 'text-color': colors.bgBottom, 'text-halo-color': '#ffffff', 'text-halo-width': 1.6 }}
                    />
                    <Layer
                        type="symbol"
                        id="praias-pin-selecionado"
                        filter={['==', ['get', 'id'], selecionado ?? '']}
                        layout={{
                            'icon-image': ['concat', ['get', 'status'], '-sel'],
                            'icon-anchor': 'bottom',
                            'icon-allow-overlap': true,
                            'icon-size': 0.52,
                            'text-field': ['get', 'nome'],
                            'text-font': ['Noto Sans Bold'],
                            'text-size': 14,
                            'text-anchor': 'top',
                            'text-offset': [0, 0.2],
                            'text-allow-overlap': true,
                        }}
                        paint={{ 'text-color': colors.brand, 'text-halo-color': '#ffffff', 'text-halo-width': 2 }}
                    />
                </GeoJSONSource>
            </Map>

            {focado && <StatusBar style="dark" />}
            <LinearGradient
                colors={['rgba(255,255,255,0.85)', 'rgba(255,255,255,0)']}
                style={[styles.scrim, { height: insets.top + 24 }]}
                pointerEvents="none"
            />
            <View style={[styles.top, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
                <HomeHeader onPress={() => navigation.navigate('Clima')} />
            </View>

            {mapaFalhou && (
                <View style={styles.mapError} accessibilityRole="alert">
                    <Text style={styles.mapErrorText}>Não foi possível carregar o mapa. Verifique sua conexão.</Text>
                </View>
            )}

            {selecionado && (
                <BotaoMapa onPress={recentralizar} rotulo="Ver todas as praias" bottom={base + CARROSSEL_ALTURA + 70}>
                    <MaterialCommunityIcons name="arrow-expand-all" size={20} color={colors.brand} />
                </BotaoMapa>
            )}
            <BotaoMapa
                onPress={irParaMaisProxima}
                disabled={localizando}
                rotulo="Ir para a praia mais próxima de mim"
                bottom={base + CARROSSEL_ALTURA + 12}
            >
                {localizando ? (
                    <ActivityIndicator color={colors.brand} />
                ) : (
                    <MaterialCommunityIcons name="crosshairs-gps" size={22} color={colors.brand} />
                )}
            </BotaoMapa>

            <FlatList
                ref={lista}
                style={[styles.carrossel, { bottom: base + 8 }]}
                data={praias}
                horizontal
                keyExtractor={(p) => p.id}
                showsHorizontalScrollIndicator={false}
                snapToInterval={cardLargura + CARD_GAP}
                decelerationRate="fast"
                contentContainerStyle={{ paddingHorizontal: (width - cardLargura) / 2, gap: CARD_GAP }}
                getItemLayout={(_, index) => ({
                    length: cardLargura + CARD_GAP,
                    offset: (cardLargura + CARD_GAP) * index,
                    index,
                })}
                onScrollBeginDrag={() => (arrastando.current = true)}
                onMomentumScrollEnd={() => (arrastando.current = false)}
                onViewableItemsChanged={aoMudarCard}
                viewabilityConfig={VISIBILIDADE}
                initialNumToRender={3}
                windowSize={5}
                renderItem={renderCard}
            />
        </View>
    );
}

function BotaoMapa({
    onPress,
    disabled,
    rotulo,
    bottom,
    children,
}: {
    onPress: () => void;
    disabled?: boolean;
    rotulo: string;
    bottom: number;
    children: ReactNode;
}) {
    return (
        <Pressable
            onPress={onPress}
            disabled={disabled}
            style={({ pressed }) => [styles.fab, { bottom }, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel={rotulo}
        >
            <Vidro style={styles.fabVidro} semVidro={styles.fabFundo} interativo>
                {children}
            </Vidro>
        </Pressable>
    );
}
