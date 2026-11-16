import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import type { Relato, TipoRelato } from '../../api/types';
import { infoRelato, TIPOS_RELATO } from '../../constants/relatos';
import { useRelatos } from '../../hooks/queries';
import { useAcoesRelato, type Resultado } from '../../hooks/useAcoesRelato';
import { colors, toneColors } from '../../theme';
import { tempoDesde } from '../../utils/format';
import { useAviso } from '../Aviso';
import BottomSheet from '../BottomSheet';
import GlassCard, { CardLabel } from '../GlassCard';
import styles from './styles';

const pessoas = (n: number) => (n === 1 ? '1 pessoa' : `${n} pessoas`);

function Linha({ relato, onPress }: { relato: Relato; onPress: () => void }) {
    const info = infoRelato(relato.tipo);
    return (
        <Pressable
            onPress={onPress}
            accessibilityRole="button"
            accessibilityLabel={`${info.rotulo}, relatado por ${pessoas(relato.confirmacoes)}, ${tempoDesde(relato.ultimo_em)}`}
            accessibilityHint="Confirmar ou contestar"
            style={({ pressed }) => [styles.linha, pressed && styles.pressed]}
        >
            <View style={[styles.icone, { backgroundColor: toneColors[info.tom].bg }]}>
                <MaterialCommunityIcons name={info.icone} size={20} color={toneColors[info.tom].fg} />
            </View>
            <Text style={styles.rotulo}>{info.rotulo}</Text>
            <Text style={styles.meta}>
                {pessoas(relato.confirmacoes)} · {tempoDesde(relato.ultimo_em)}
            </Text>
            <Feather name="chevron-right" size={16} color={colors.textSubtle} />
        </Pressable>
    );
}

export default function RelatosCard({ codigo }: { codigo: string }) {
    const { data } = useRelatos(codigo);
    const { relatar, contestar, enviando } = useAcoesRelato(codigo);
    const [escolhendo, setEscolhendo] = useState(false);
    const [selecionado, setSelecionado] = useState<Relato | null>(null);
    const avisar = useAviso();

    if (!data?.disponivel) return null;

    const concluir = (resultado: Resultado, sucesso: string, fechar: () => void) => {
        if (resultado.ok) {
            fechar();
            avisar(sucesso);
        } else if (resultado.erro) {
            fechar();
            avisar(resultado.erro, 'erro');
        }
    };

    const escolher = async (tipo: TipoRelato) =>
        concluir(await relatar(tipo), 'Obrigado! Seu relato ajuda quem está indo para a praia.', () => setEscolhendo(false));

    const confirmar = async (relato: Relato) =>
        concluir(await relatar(relato.tipo), 'Valeu! Sua confirmação foi registrada.', () => setSelecionado(null));

    const contestarRelato = async (relato: Relato) =>
        concluir(await contestar(relato.tipo), 'Obrigado! Vamos considerar sua contestação.', () => setSelecionado(null));

    const info = selecionado ? infoRelato(selecionado.tipo) : null;

    return (
        <GlassCard style={styles.card}>
            <CardLabel
                icon={<MaterialCommunityIcons name="account-voice" size={18} color={colors.label} />}
                right={<Text style={styles.validade}>últimas 5 h</Text>}
            >
                Agora na praia
            </CardLabel>

            {data.relatos.length ? (
                <View style={styles.lista}>
                    {data.relatos.map((r) => (
                        <Linha key={r.tipo} relato={r} onPress={() => setSelecionado(r)} />
                    ))}
                </View>
            ) : (
                <Text style={styles.vazio}>Ninguém relatou nada nas últimas horas.</Text>
            )}

            <Pressable
                onPress={() => setEscolhendo(true)}
                accessibilityRole="button"
                style={({ pressed }) => [styles.botao, pressed && styles.pressed]}
            >
                <MaterialCommunityIcons name="bullhorn-outline" size={18} color={colors.sand} />
                <Text style={styles.botaoTexto}>Como está a praia agora?</Text>
            </Pressable>

            <BottomSheet visible={escolhendo} onClose={() => setEscolhendo(false)} bloqueado={enviando}>
                <Text style={styles.titulo} accessibilityRole="header">
                    Como está a praia?
                </Text>
                <Text style={styles.subtitulo}>Seu relato fica visível por 5 horas.</Text>
                <View style={styles.grade}>
                    {TIPOS_RELATO.map((t) => (
                        <Pressable
                            key={t.tipo}
                            disabled={enviando}
                            onPress={() => escolher(t.tipo)}
                            accessibilityRole="button"
                            style={({ pressed }) => [styles.opcao, pressed && styles.opcaoPressionada]}
                        >
                            <MaterialCommunityIcons name={t.icone} size={26} color={toneColors[t.tom].solid} />
                            <Text style={styles.opcaoTexto}>{t.rotulo}</Text>
                        </Pressable>
                    ))}
                </View>
                {enviando && <ActivityIndicator color={colors.brand} style={styles.carregando} />}
            </BottomSheet>

            <BottomSheet visible={!!selecionado} onClose={() => setSelecionado(null)} bloqueado={enviando}>
                {selecionado && info && (
                    <View style={styles.detalhe}>
                        <View style={[styles.iconeGrande, { backgroundColor: `${toneColors[info.tom].solid}1F` }]}>
                            <MaterialCommunityIcons name={info.icone} size={34} color={toneColors[info.tom].solid} />
                        </View>
                        <Text style={styles.titulo} accessibilityRole="header">
                            {info.rotulo}
                        </Text>
                        <Text style={styles.subtitulo}>
                            Relatado por {pessoas(selecionado.confirmacoes)} · {tempoDesde(selecionado.ultimo_em)}
                        </Text>
                        <Text style={styles.pergunta}>Você está na praia agora? Confirme ou conteste.</Text>

                        <Pressable
                            disabled={enviando}
                            onPress={() => confirmar(selecionado)}
                            accessibilityRole="button"
                            style={({ pressed }) => [styles.acaoPrincipal, (pressed || enviando) && styles.pressed]}
                        >
                            {enviando ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <>
                                    <Feather name="check" size={18} color="#fff" />
                                    <Text style={styles.acaoPrincipalTexto}>Eu também vi</Text>
                                </>
                            )}
                        </Pressable>
                        <Pressable
                            disabled={enviando}
                            onPress={() => contestarRelato(selecionado)}
                            accessibilityRole="button"
                            style={({ pressed }) => [styles.acaoSecundaria, pressed && styles.pressed]}
                        >
                            <Feather name="x" size={18} color={toneColors.danger.solid} />
                            <Text style={styles.acaoSecundariaTexto}>Não é verdade</Text>
                        </Pressable>
                        <Pressable
                            disabled={enviando}
                            onPress={() => setSelecionado(null)}
                            accessibilityRole="button"
                            style={styles.acaoTexto}
                        >
                            <Text style={styles.cancelar}>Cancelar</Text>
                        </Pressable>
                    </View>
                )}
            </BottomSheet>
        </GlassCard>
    );
}
