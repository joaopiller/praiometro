import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, RefreshControl, ScrollView, SectionList, Text, TextInput, View } from 'react-native';
import { getErrorMessage } from '../../api/client';
import BeachCard from '../../components/BeachCard';
import DataNotice from '../../components/DataNotice';
import Screen from '../../components/Screen';
import StateView from '../../components/StateView';
import Vidro from '../../components/Vidro';
import { useEspacoDasAbas } from '../../navigation/useEspacoDasAbas';
import type { PraiaResumo } from '../../api/types';
import { CIDADES, ORDEM_CIDADES } from '../../config/cidades';
import { usePraias } from '../../hooks/queries';
import { useCidadeDaPessoa } from '../../hooks/useLugar';
import { useLocalizacao } from '../../hooks/useLocalizacao';
import { usePuxarParaAtualizar } from '../../hooks/usePuxarParaAtualizar';
import { formatDistancia, ordenarPraiasPorDistancia } from '../../utils/geo';
import type { PraiasScreenProps } from '../../navigation/types';
import { colors } from '../../theme';
import { buscaPraia, nomeSemPrefixo } from '../../utils/search';
import styles from './styles';

type Filtro = 'todas' | 'proprias' | 'perto';
type Item = { praia: PraiaResumo; distancia?: string };
/** sem título quando a lista está em ordem de distância, misturando as cidades */
type Secao = { titulo: string | null; data: Item[] };
const FILTROS: { id: Filtro; label: string; icone?: 'crosshairs-gps' }[] = [
    { id: 'todas', label: 'Todas' },
    { id: 'proprias', label: 'Própria para banho' },
    { id: 'perto', label: 'Perto de mim', icone: 'crosshairs-gps' },
];

export default function Praias({ navigation }: PraiasScreenProps<'Praias'>) {
    const { data, isPending, error, refetch } = usePraias();
    const [puxando, puxar] = usePuxarParaAtualizar(refetch);
    const [busca, setBusca] = useState('');
    const [filtro, setFiltro] = useState<Filtro>('todas');
    const espacoAbas = useEspacoDasAbas();
    // a cidade onde a pessoa está vem primeiro, mesmo que ela tenha trocado a do mapa
    const cidade = useCidadeDaPessoa();

    const { coordenada, carregando: localizando, erro: erroLocal, localizar } = useLocalizacao();

    const secoes = useMemo((): Secao[] => {
        // "Própria para banho" inclui as que estão boas só em parte: o card avisa quantos trechos
        const filtradas = (data ?? []).filter(
            (p) => buscaPraia(p, busca) && (filtro !== 'proprias' || p.situacao === 'propria' || p.situacao === 'parcial'),
        );
        if (filtro === 'perto' && coordenada) {
            const data = ordenarPraiasPorDistancia(filtradas, coordenada).map(({ praia, km }) => ({ praia, distancia: formatDistancia(km) }));
            return data.length ? [{ titulo: null, data }] : [];
        }
        // uma seção por cidade, a da pessoa primeiro
        return [cidade, ...ORDEM_CIDADES.filter((c) => c !== cidade)]
            .map((c) => ({
                titulo: CIDADES[c].nome,
                data: filtradas
                    .filter((p) => p.cidade === c)
                    .sort((a, b) => nomeSemPrefixo(a.nome).localeCompare(nomeSemPrefixo(b.nome), 'pt-BR'))
                    .map((praia) => ({ praia })),
            }))
            .filter((s) => s.data.length);
    }, [data, busca, filtro, coordenada, cidade]);

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
            <SectionList
                sections={secoes}
                stickySectionHeadersEnabled={false}
                keyExtractor={(p) => p.praia.id}
                contentContainerStyle={[styles.list, espacoAbas > 0 && { paddingBottom: espacoAbas + 32 }]}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                refreshControl={<RefreshControl refreshing={puxando} onRefresh={puxar} tintColor={colors.text} colors={[colors.brand]} />}
                ListHeaderComponent={
                    <View style={styles.header}>
                        {error ? <DataNotice timestamp={data?.[0]?.ultima_leitura} refreshError /> : null}
                        <Vidro style={styles.search} semVidro={styles.searchFundo} escuro>
                            <Ionicons name="search" size={20} color={colors.textMuted} />
                            <TextInput
                                style={styles.input}
                                placeholder="Buscar praia, bairro ou cidade..."
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
                        <ScrollView
                            horizontal
                            showsHorizontalScrollIndicator={false}
                            // em telas estreitas os filtros rolam de lado em vez de cortar
                            style={styles.chipsRolagem}
                            contentContainerStyle={styles.chips}
                            accessibilityRole="radiogroup"
                        >
                            {FILTROS.map((f) => {
                                const ativo = filtro === f.id;
                                return (
                                    <Pressable
                                        key={f.id}
                                        onPress={() => escolherFiltro(f.id)}
                                        accessibilityRole="radio"
                                        accessibilityState={{ selected: ativo }}
                                        hitSlop={{ top: 6, bottom: 6 }}
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
                        </ScrollView>
                        {filtro === 'perto' && erroLocal ? <Text style={styles.aviso}>{erroLocal}</Text> : null}
                    </View>
                }
                ItemSeparatorComponent={() => <View style={styles.separator} />}
                renderSectionHeader={({ section }) =>
                    section.titulo ? (
                        <View style={styles.secao} accessibilityRole="header">
                            <Text style={styles.secaoTitulo}>{section.titulo}</Text>
                            <Text style={styles.secaoTotal}>
                                {section.data.length} {section.data.length === 1 ? 'praia' : 'praias'}
                            </Text>
                        </View>
                    ) : null
                }
                SectionSeparatorComponent={() => <View style={styles.separator} />}
                renderItem={({ item }) => (
                    <BeachCard
                        praia={item.praia}
                        distancia={item.distancia}
                        onPress={() => navigation.navigate('Praia', { id: item.praia.id })}
                    />
                )}
                ListEmptyComponent={<Text style={styles.empty}>Nenhuma praia encontrada.</Text>}
            />
        </Screen>
    );
}
