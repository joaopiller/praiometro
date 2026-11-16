import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, TextInput, View } from 'react-native';
import { getErrorMessage } from '../../api/client';
import BeachCard from '../../components/BeachCard';
import DataNotice from '../../components/DataNotice';
import Screen from '../../components/Screen';
import StateView from '../../components/StateView';
import Vidro from '../../components/Vidro';
import { useEspacoDasAbas } from '../../navigation/useEspacoDasAbas';
import { usePontos } from '../../hooks/queries';
import { useLocalizacao } from '../../hooks/useLocalizacao';
import { formatDistancia, ordenarPorDistancia } from '../../utils/geo';
import type { PraiasScreenProps } from '../../navigation/types';
import { colors } from '../../theme';
import { matchesBeach, nomePrincipal, nomeSemPrefixo } from '../../utils/search';
import styles from './styles';

type Filtro = 'todas' | 'proprias' | 'perto';
const FILTROS: { id: Filtro; label: string; icone?: 'crosshairs-gps' }[] = [
    { id: 'todas', label: 'Todas' },
    { id: 'proprias', label: 'Próprias' },
    { id: 'perto', label: 'Perto de mim', icone: 'crosshairs-gps' },
];

export default function Praias({ navigation }: PraiasScreenProps<'Praias'>) {
    const { data, isPending, error, refetch, isRefetching } = usePontos();
    const [busca, setBusca] = useState('');
    const [filtro, setFiltro] = useState<Filtro>('todas');
    const espacoAbas = useEspacoDasAbas();

    const { coordenada, carregando: localizando, erro: erroLocal, localizar } = useLocalizacao();

    const praias = useMemo(() => {
        const filtradas = (data ?? []).filter(
            (p) => matchesBeach(p, busca) && (filtro !== 'proprias' || p.balneabilidade === true),
        );
        if (filtro === 'perto' && coordenada) {
            return ordenarPorDistancia(filtradas, coordenada).map(({ ponto, km }) => ({ ponto, distancia: formatDistancia(km) }));
        }
        return filtradas
            .sort((a, b) => nomeSemPrefixo(nomePrincipal(a)).localeCompare(nomeSemPrefixo(nomePrincipal(b)), 'pt-BR'))
            .map((ponto) => ({ ponto, distancia: undefined as string | undefined }));
    }, [data, busca, filtro, coordenada]);

    const escolherFiltro = (f: Filtro) => {
        setFiltro(f);
        if (f === 'perto') localizar();
    };

    if (isPending || (error && !data)) {
        return (
            <Screen scroll={false}>
                <StateView loading={isPending} error={error ? getErrorMessage(error) : null} onRetry={() => refetch()} />
            </Screen>
        );
    }

    return (
        <Screen scroll={false}>
            <FlatList
                data={praias}
                keyExtractor={(p) => p.ponto.codigo}
                contentContainerStyle={[styles.list, espacoAbas > 0 && { paddingBottom: espacoAbas + 32 }]}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                onRefresh={() => refetch()}
                refreshing={isRefetching}
                ListHeaderComponent={
                    <View style={styles.header}>
                        {error ? <DataNotice timestamp={data?.[0]?.ultima_leitura} refreshError /> : null}
                        <Vidro style={styles.search} semVidro={styles.searchFundo} escuro>
                            <Ionicons name="search" size={20} color={colors.textMuted} />
                            <TextInput
                                style={styles.input}
                                placeholder="Buscar praia ou local..."
                                placeholderTextColor={colors.textSubtle}
                                value={busca}
                                onChangeText={setBusca}
                                returnKeyType="search"
                                keyboardAppearance="dark"
                                autoCorrect={false}
                                accessibilityLabel="Buscar praia"
                            />
                            {busca ? (
                                <Pressable onPress={() => setBusca('')} hitSlop={10} accessibilityLabel="Limpar busca">
                                    <Ionicons name="close-circle" size={20} color={colors.textMuted} />
                                </Pressable>
                            ) : null}
                        </Vidro>
                        <View style={styles.chips} accessibilityRole="radiogroup">
                            {FILTROS.map((f) => {
                                const ativo = filtro === f.id;
                                return (
                                    <Pressable
                                        key={f.id}
                                        onPress={() => escolherFiltro(f.id)}
                                        accessibilityRole="radio"
                                        accessibilityState={{ selected: ativo }}
                                        style={[styles.chip, ativo && styles.chipActive]}
                                    >
                                        {f.icone &&
                                            (ativo && localizando ? (
                                                <ActivityIndicator size="small" color={colors.brand} />
                                            ) : (
                                                <MaterialCommunityIcons
                                                    name={f.icone}
                                                    size={14}
                                                    color={ativo ? colors.brand : colors.text}
                                                />
                                            ))}
                                        <Text style={[styles.chipText, ativo && styles.chipTextActive]}>{f.label}</Text>
                                    </Pressable>
                                );
                            })}
                        </View>
                        {filtro === 'perto' && erroLocal ? <Text style={styles.aviso}>{erroLocal}</Text> : null}
                        <Text style={styles.count}>
                            {praias.length} {praias.length === 1 ? 'ponto' : 'pontos'} de coleta
                        </Text>
                    </View>
                }
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                renderItem={({ item }) => (
                    <BeachCard
                        ponto={item.ponto}
                        distancia={item.distancia}
                        onPress={() => navigation.navigate('Praia', { id: item.ponto.codigo })}
                    />
                )}
                ListEmptyComponent={<Text style={styles.empty}>Nenhuma praia encontrada.</Text>}
            />
        </Screen>
    );
}
