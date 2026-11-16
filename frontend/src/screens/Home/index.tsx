import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Camera, GeoJSONSource, Images, Layer, Map, UserLocation, type CameraRef } from '@maplibre/maplibre-react-native';
import { useIsFocused } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, useWindowDimensions, View, type ListViewToken } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getErrorMessage } from '../../api/client';
import type { PontoResumo } from '../../api/types';
import { useAviso } from '../../components/Aviso';
import HomeHeader from '../../components/HomeHeader';
import MapBeachCard from '../../components/MapBeachCard';
import Screen from '../../components/Screen';
import StateView from '../../components/StateView';
import Vidro from '../../components/Vidro';
import { MAPA_INICIAL } from '../../constants/beaches';
import { usePontos } from '../../hooks/queries';
import { useLocalizacao } from '../../hooks/useLocalizacao';
import type { TabScreenProps } from '../../navigation/types';
import { useEspacoDasAbas } from '../../navigation/useEspacoDasAbas';
import { colors } from '../../theme';
import { coordenadaDoPonto, distanciaKm, formatDistancia, ordenarPorDistancia } from '../../utils/geo';
import { localEspecifico, nomePrincipal } from '../../utils/search';
import styles, { CARD_GAP, CARROSSEL_ALTURA } from './styles';

const PINS = {
    propria: require('../../../assets/images/pins/pin-propria.png'),
    impropria: require('../../../assets/images/pins/pin-impropria.png'),
    'sem-dados': require('../../../assets/images/pins/pin-sem-dados.png'),
    'propria-sel': require('../../../assets/images/pins/pin-propria-sel.png'),
    'impropria-sel': require('../../../assets/images/pins/pin-impropria-sel.png'),
    'sem-dados-sel': require('../../../assets/images/pins/pin-sem-dados-sel.png'),
};

const status = (p: PontoResumo) => (p.balneabilidade === true ? 'propria' : p.balneabilidade === false ? 'impropria' : 'sem-dados');

// [lat, lon] da API → [lon, lat] do GeoJSON
const posicao = (p: PontoResumo): [number, number] => [p.coordenadas_terra![1], p.coordenadas_terra![0]];

const VISIBILIDADE = { itemVisiblePercentThreshold: 70 };

export default function Home({ navigation }: TabScreenProps<'Home'>) {
    const { data, isPending, error, refetch } = usePontos();
    const insets = useSafeAreaInsets();
    const focado = useIsFocused();
    const { width } = useWindowDimensions();
    const camera = useRef<CameraRef>(null);
    const lista = useRef<FlatList<PontoResumo>>(null);
    const [selecionado, setSelecionado] = useState<string | null>(null);
    const [mapaFalhou, setMapaFalhou] = useState(false);
    const base = useEspacoDasAbas();
    const { coordenada: origem, carregando: localizando, localizar } = useLocalizacao();
    const avisar = useAviso();

    const cardLargura = Math.min(width - 56, 380);

    // na ordem do litoral: cada card do carrossel é vizinho do anterior
    const praias = useMemo(
        () => (data ?? []).filter((p) => p.coordenadas_terra?.length === 2).sort((a, b) => (a.ordem ?? 0) - (b.ordem ?? 0)),
        [data],
    );

    const geojson = useMemo<GeoJSON.FeatureCollection>(
        () => ({
            type: 'FeatureCollection',
            features: praias.map((p) => ({
                type: 'Feature',
                id: p.codigo,
                geometry: { type: 'Point', coordinates: posicao(p) },
                properties: { codigo: p.codigo, nome: nomePrincipal(p).replace(/^Praia (d[aeo]s?|de) /, ''), status: status(p) },
            })),
        }),
        [praias],
    );

    const focar = useCallback(
        (codigo: string, rolarLista: boolean) => {
            const indice = praias.findIndex((p) => p.codigo === codigo);
            if (indice < 0) return;
            setSelecionado(codigo);
            camera.current?.flyTo({
                center: posicao(praias[indice]),
                zoom: 13.5,
                duration: 700,
                padding: { bottom: base + CARROSSEL_ALTURA, top: 0, left: 0, right: 0 },
            });
            if (rolarLista) lista.current?.scrollToOffset({ offset: indice * (cardLargura + CARD_GAP), animated: true });
        },
        [praias, cardLargura, base],
    );

    const irParaMaisProxima = async () => {
        const r = await localizar();
        if ('erro' in r) {
            avisar(r.erro, 'erro');
            return;
        }
        const [maisProxima] = ordenarPorDistancia(praias, r.coordenada);
        if (maisProxima) focar(maisProxima.ponto.codigo, true);
    };


    const abrirPraia = useCallback(
        (codigo: string) => navigation.navigate('PraiasTab', { screen: 'Praia', params: { id: codigo } }),
        [navigation],
    );

    // cards memorizados: mudar a seleção só redesenha os dois cards afetados
    const renderCard = useCallback(
        ({ item }: { item: PontoResumo }) => {
            const c = origem && coordenadaDoPonto(item);
            return (
                <MapBeachCard
                    ponto={item}
                    nome={nomePrincipal(item)}
                    local={localEspecifico(item)}
                    largura={cardLargura}
                    selecionado={item.codigo === selecionado}
                    distancia={c ? formatDistancia(distanciaKm(origem, c)) : undefined}
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
        const atual: PontoResumo | undefined = viewableItems.find((v) => v.isViewable)?.item;
        if (atual && arrastando.current) focarRef.current(atual.codigo, false);
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
                <GeoJSONSource
                    id="praias"
                    data={geojson}
                    onPress={(e) => {
                        const codigo = e.nativeEvent.features[0]?.properties?.codigo;
                        if (codigo) focar(codigo, true);
                    }}
                    hitbox={{ top: 18, right: 18, bottom: 18, left: 18 }}
                >
                    <Layer
                        type="symbol"
                        id="praias-pin"
                        filter={['!=', ['get', 'codigo'], selecionado ?? '']}
                        style={{
                            iconImage: ['get', 'status'],
                            iconAnchor: 'bottom',
                            iconAllowOverlap: true,
                            iconSize: ['interpolate', ['linear'], ['zoom'], 10, 0.3, 13, 0.36, 16, 0.44],
                        }}
                    />
                    <Layer
                        type="symbol"
                        id="praias-nome"
                        minzoom={12.5}
                        filter={['!=', ['get', 'codigo'], selecionado ?? '']}
                        style={{
                            textField: ['get', 'nome'],
                            textFont: ['Noto Sans Bold'],
                            textSize: 12,
                            textAnchor: 'top',
                            textOffset: [0, 0.3],
                            textColor: colors.bgBottom,
                            textHaloColor: '#ffffff',
                            textHaloWidth: 1.6,
                            textOptional: true,
                        }}
                    />
                    <Layer
                        type="symbol"
                        id="praias-pin-selecionado"
                        filter={['==', ['get', 'codigo'], selecionado ?? '']}
                        style={{
                            iconImage: ['concat', ['get', 'status'], '-sel'],
                            iconAnchor: 'bottom',
                            iconAllowOverlap: true,
                            iconSize: 0.52,
                            textField: ['get', 'nome'],
                            textFont: ['Noto Sans Bold'],
                            textSize: 14,
                            textAnchor: 'top',
                            textOffset: [0, 0.2],
                            textAllowOverlap: true,
                            textColor: colors.brand,
                            textHaloColor: '#ffffff',
                            textHaloWidth: 2,
                        }}
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
                keyExtractor={(p) => p.codigo}
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
