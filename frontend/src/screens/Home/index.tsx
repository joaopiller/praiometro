import { MaterialCommunityIcons } from '@expo/vector-icons';
import MapLibreGL, { type CameraRef } from '@maplibre/maplibre-react-native';
import { useIsFocused } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Pressable, Text, useWindowDimensions, View, type ViewToken } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { getErrorMessage } from '../../api/client';
import type { PontoResumo } from '../../api/types';
import HomeHeader from '../../components/HomeHeader';
import MapBeachCard from '../../components/MapBeachCard';
import Screen from '../../components/Screen';
import StateView from '../../components/StateView';
import { MAPA_INICIAL } from '../../constants/beaches';
import { usePontos } from '../../hooks/queries';
import { useLocalizacao } from '../../hooks/useLocalizacao';
import type { TabScreenProps } from '../../navigation/types';
import { colors } from '../../theme';
import { coordenadaDoPonto, distanciaKm, formatDistancia, ordenarPorDistancia } from '../../utils/geo';
import { localEspecifico, nomePrincipal } from '../../utils/search';
import styles, { CARD_GAP, CARROSSEL_ALTURA } from './styles';

MapLibreGL.setAccessToken(null);

const PINS = {
    propria: require('../../../assets/images/pins/pin-propria.png'),
    impropria: require('../../../assets/images/pins/pin-impropria.png'),
    'sem-dados': require('../../../assets/images/pins/pin-sem-dados.png'),
};

const status = (p: PontoResumo) => (p.balneabilidade === true ? 'propria' : p.balneabilidade === false ? 'impropria' : 'sem-dados');

// [lat, lon] da API → [lon, lat] do GeoJSON
const posicao = (p: PontoResumo): [number, number] => [p.coordenadas_terra![1], p.coordenadas_terra![0]];

const LEGENDA = [
    { cor: '#2FA35A', texto: 'Própria' },
    { cor: '#D9483B', texto: 'Imprópria' },
    { cor: '#5D7690', texto: 'Sem dados' },
];

export default function Home({ navigation }: TabScreenProps<'Home'>) {
    const { data, isPending, error, refetch } = usePontos();
    const insets = useSafeAreaInsets();
    const focado = useIsFocused();
    const { width } = useWindowDimensions();
    const camera = useRef<CameraRef>(null);
    const lista = useRef<FlatList<PontoResumo>>(null);
    const [selecionado, setSelecionado] = useState<string | null>(null);
    const [mapaFalhou, setMapaFalhou] = useState(false);
    const { coordenada: origem, carregando: localizando, localizar } = useLocalizacao();

    const cardLargura = Math.min(width - 56, 380);

    // ordenadas de oeste para leste, seguindo a orla
    const praias = useMemo(
        () => (data ?? []).filter((p) => p.coordenadas_terra?.length === 2).sort((a, b) => posicao(a)[0] - posicao(b)[0]),
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
            camera.current?.setCamera({
                centerCoordinate: posicao(praias[indice]),
                zoomLevel: 13.5,
                animationDuration: 700,
                animationMode: 'flyTo',
                padding: { paddingBottom: CARROSSEL_ALTURA, paddingTop: 0, paddingLeft: 0, paddingRight: 0 },
            });
            if (rolarLista) lista.current?.scrollToOffset({ offset: indice * (cardLargura + CARD_GAP), animated: true });
        },
        [praias, cardLargura],
    );

    const irParaMaisProxima = async () => {
        const r = await localizar();
        if ('erro' in r) {
            Alert.alert('Localização indisponível', r.erro);
            return;
        }
        const [maisProxima] = ordenarPorDistancia(praias, r.coordenada);
        if (maisProxima) focar(maisProxima.ponto.codigo, true);
    };

    const distancia = (p: PontoResumo) => {
        const c = origem && coordenadaDoPonto(p);
        return c ? formatDistancia(distanciaKm(origem, c)) : undefined;
    };

    const recentralizar = () => {
        setSelecionado(null);
        camera.current?.setCamera({ centerCoordinate: MAPA_INICIAL.centro, zoomLevel: MAPA_INICIAL.zoom, animationDuration: 700 });
    };

    const aoMudarCard = useRef(({ viewableItems }: { viewableItems: ViewToken<PontoResumo>[] }) => {
        const atual = viewableItems.find((v) => v.isViewable)?.item;
        if (atual && arrastando.current) focarRef.current(atual.codigo, false);
    }).current;
    const arrastando = useRef(false);
    const focarRef = useRef(focar);
    focarRef.current = focar;

    if (isPending || (error && !data)) {
        return (
            <Screen scroll={false}>
                <StateView loading={isPending} error={error ? getErrorMessage(error) : null} onRetry={() => refetch()} />
            </Screen>
        );
    }

    return (
        <View style={styles.container}>
            <MapLibreGL.MapView
                style={styles.map}
                mapStyle="https://tiles.openfreemap.org/styles/liberty"
                logoEnabled={false}
                compassEnabled={false}
                attributionPosition={{ bottom: CARROSSEL_ALTURA + 4, left: 8 }}
                onDidFailLoadingMap={() => setMapaFalhou(true)}
                onDidFinishLoadingMap={() => setMapaFalhou(false)}
                onPress={() => setSelecionado(null)}
            >
                <MapLibreGL.Camera
                    ref={camera}
                    defaultSettings={{ centerCoordinate: MAPA_INICIAL.centro, zoomLevel: MAPA_INICIAL.zoom }}
                    minZoomLevel={9}
                    maxZoomLevel={17}
                />
                <MapLibreGL.Images images={PINS} />
                {origem && <MapLibreGL.UserLocation visible animated />}
                <MapLibreGL.ShapeSource
                    id="praias"
                    shape={geojson}
                    onPress={(e) => {
                        const codigo = e.features[0]?.properties?.codigo;
                        if (codigo) focar(codigo, true);
                    }}
                    hitbox={{ width: 36, height: 36 }}
                >
                    <MapLibreGL.SymbolLayer
                        id="praias-pin"
                        filter={['!=', ['get', 'codigo'], selecionado ?? '']}
                        style={{
                            iconImage: ['get', 'status'],
                            iconAnchor: 'bottom',
                            iconAllowOverlap: true,
                            iconSize: ['interpolate', ['linear'], ['zoom'], 10, 0.24, 13, 0.32, 16, 0.4],
                        }}
                    />
                    <MapLibreGL.SymbolLayer
                        id="praias-nome"
                        minZoomLevel={12.5}
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
                    <MapLibreGL.SymbolLayer
                        id="praias-pin-selecionado"
                        filter={['==', ['get', 'codigo'], selecionado ?? '']}
                        style={{
                            iconImage: ['get', 'status'],
                            iconAnchor: 'bottom',
                            iconAllowOverlap: true,
                            iconSize: 0.6,
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
                </MapLibreGL.ShapeSource>
            </MapLibreGL.MapView>

            {focado && <StatusBar style="dark" />}
            <LinearGradient
                colors={['rgba(255,255,255,0.85)', 'rgba(255,255,255,0)']}
                style={[styles.scrim, { height: insets.top + 24 }]}
                pointerEvents="none"
            />
            <View style={[styles.top, { paddingTop: insets.top + 8 }]} pointerEvents="box-none">
                <HomeHeader onPress={() => navigation.navigate('Clima')} />
                <View style={styles.legenda} accessible accessibilityLabel="Legenda: verde própria, vermelho imprópria, cinza sem dados">
                    {LEGENDA.map((l) => (
                        <View key={l.texto} style={styles.legendaItem}>
                            <View style={[styles.legendaPonto, { backgroundColor: l.cor }]} />
                            <Text style={styles.legendaTexto}>{l.texto}</Text>
                        </View>
                    ))}
                </View>
            </View>

            {mapaFalhou && (
                <View style={styles.mapError} accessibilityRole="alert">
                    <Text style={styles.mapErrorText}>Não foi possível carregar o mapa. Verifique sua conexão.</Text>
                </View>
            )}

            {selecionado && (
                <Pressable
                    onPress={recentralizar}
                    style={({ pressed }) => [styles.fab, { bottom: CARROSSEL_ALTURA + 70 }, pressed && styles.pressed]}
                    accessibilityRole="button"
                    accessibilityLabel="Ver todas as praias"
                >
                    <MaterialCommunityIcons name="arrow-expand-all" size={20} color={colors.brand} />
                </Pressable>
            )}
            <Pressable
                onPress={irParaMaisProxima}
                disabled={localizando}
                style={({ pressed }) => [styles.fab, { bottom: CARROSSEL_ALTURA + 12 }, pressed && styles.pressed]}
                accessibilityRole="button"
                accessibilityLabel="Ir para a praia mais próxima de mim"
            >
                {localizando ? (
                    <ActivityIndicator color={colors.brand} />
                ) : (
                    <MaterialCommunityIcons name="crosshairs-gps" size={22} color={colors.brand} />
                )}
            </Pressable>

            <FlatList
                ref={lista}
                style={styles.carrossel}
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
                viewabilityConfig={{ itemVisiblePercentThreshold: 70 }}
                renderItem={({ item }) => (
                    <MapBeachCard
                        ponto={item}
                        nome={nomePrincipal(item)}
                        local={localEspecifico(item)}
                        largura={cardLargura}
                        selecionado={item.codigo === selecionado}
                        distancia={distancia(item)}
                        onPress={() => navigation.navigate('PraiasTab', { screen: 'Praia', params: { id: item.codigo } })}
                    />
                )}
            />
        </View>
    );
}
