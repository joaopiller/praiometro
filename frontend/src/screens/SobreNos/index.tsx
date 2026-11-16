import { FontAwesome, MaterialCommunityIcons } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { sair, useConta } from '../../auth/sessao';
import { useAviso } from '../../components/Aviso';
import GlassCard, { CardLabel } from '../../components/GlassCard';
import Screen from '../../components/Screen';
import { CONTATO, env } from '../../config/env';
import { colors, toneColors } from '../../theme';
import styles from './styles';

const LEGENDA = [
    { cor: toneColors.success.solid, titulo: 'Própria para banho', texto: 'a água atende ao padrão de qualidade' },
    { cor: toneColors.warning.solid, titulo: 'Parcialmente própria', texto: 'alguns trechos da praia estão próprios para banho e outros não' },
    { cor: toneColors.danger.solid, titulo: 'Imprópria para banho', texto: 'evite entrar no mar' },
    { cor: toneColors.neutral.solid, titulo: 'Sem boletim recente', texto: 'a praia não entrou no último boletim' },
];

const FONTES = [
    { nome: 'INEA', detalhe: 'Balneabilidade' },
    { nome: 'Open-Meteo', detalhe: 'Clima, mar, maré e sol' },
    { nome: 'OpenStreetMap', detalhe: 'Mapa' },
];

const EQUIPE = 'Rafael Lucio, João Vicente Piller, Lucas Silveira e Pâmella de Azevedo';

const NOME_DA_CONTA = { google: 'Google', apple: 'Apple' };

/** Aparece só para quem já entrou: o app lembra da conta, então precisa dar como sair. */
function Conta() {
    const conta = useConta();
    const avisar = useAviso();
    if (!conta) return null;
    const desconectar = async () => {
        await sair();
        avisar('Você saiu da sua conta.', 'sucesso');
    };
    return (
        <GlassCard style={styles.card}>
            <CardLabel icon={<MaterialCommunityIcons name="account-circle-outline" size={18} color={colors.label} />}>
                Sua conta
            </CardLabel>
            <Text style={styles.texto}>
                Você entrou com a conta {NOME_DA_CONTA[conta]}. O app lembra dela para você avaliar e relatar sem entrar de
                novo.
            </Text>
            <Pressable
                onPress={desconectar}
                accessibilityRole="button"
                style={({ pressed }) => [styles.sair, pressed && styles.pressed]}
            >
                <Text style={styles.sairTexto}>Sair da conta</Text>
            </Pressable>
        </GlassCard>
    );
}

function Contato({ icone, texto, url }: { icone: ComponentProps<typeof FontAwesome>['name']; texto: string; url: string }) {
    const avisar = useAviso();
    const abrir = () => Linking.openURL(url).catch(() => avisar('Não foi possível abrir o link.', 'erro'));
    return (
        <Pressable
            onPress={abrir}
            accessibilityRole="link"
            style={({ pressed }) => [styles.botao, pressed && styles.pressed]}
        >
            <FontAwesome name={icone} size={18} color={colors.brand} />
            <Text style={styles.botaoTexto}>{texto}</Text>
        </Pressable>
    );
}

export default function SobreNos() {
    return (
        <Screen contentStyle={styles.conteudo}>
            <GlassCard style={styles.card}>
                <Text style={styles.titulo} accessibilityRole="header">
                    Sobre o Praiômetro
                </Text>
                <Text style={styles.texto}>
                    Projeto de extensão da Universidade Federal Fluminense (UFF) que reúne, em um só lugar, as informações que
                    importam para quem vai à praia em Niterói e no Rio de Janeiro.
                </Text>
                <Text style={styles.equipe}>Feito por {EQUIPE}.</Text>
            </GlassCard>

            <GlassCard style={styles.card}>
                <CardLabel icon={<MaterialCommunityIcons name="help-circle-outline" size={18} color={colors.label} />}>
                    Como ler os dados
                </CardLabel>
                {LEGENDA.map((l) => (
                    <View key={l.titulo} style={styles.legenda}>
                        <View style={[styles.ponto, { backgroundColor: l.cor }]} />
                        <Text style={styles.texto}>
                            <Text style={styles.forte}>{l.titulo}</Text>: {l.texto}
                        </Text>
                    </View>
                ))}
                <Text style={styles.dica}>
                    O INEA mede a água em vários trechos de cada praia e publica boletins cerca de duas vezes por semana. No Rio,
                    o app cobre as praias da Zona Sul e da Zona Sudoeste. Depois de chuva forte, evite o banho por até 24 horas,
                    mesmo em praias próprias.
                </Text>
            </GlassCard>

            <GlassCard style={styles.card}>
                <CardLabel icon={<MaterialCommunityIcons name="database-outline" size={18} color={colors.label} />}>
                    Fontes
                </CardLabel>
                {FONTES.map((f) => (
                    <View key={f.nome} style={styles.fonte}>
                        <Text style={styles.forte}>{f.nome}</Text>
                        <Text style={styles.fonteDetalhe}>{f.detalhe}</Text>
                    </View>
                ))}
            </GlassCard>

            <Conta />

            <View style={styles.contatos}>
                <Contato icone="instagram" texto="@praiometronit" url={CONTATO.instagram} />
                {CONTATO.email ? <Contato icone="envelope" texto="E-mail" url={`mailto:${CONTATO.email}`} /> : null}
            </View>

            <Text style={styles.rodape}>As informações são indicativas: siga sempre os guarda-vidas e a Defesa Civil.</Text>
            <Text style={styles.versao}>Versão {env.appVersion}</Text>
        </Screen>
    );
}
