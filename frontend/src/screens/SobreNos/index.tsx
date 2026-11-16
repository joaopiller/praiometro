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

// a licença do mapa pede o crédito aos colaboradores, com link; como o botão de créditos
// não fica mais sobre o mapa, ele aparece aqui
const LICENCA_DO_MAPA = 'https://www.openstreetmap.org/copyright';

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

function CreditoDoMapa() {
    const avisar = useAviso();
    return (
        <Pressable
            onPress={() => Linking.openURL(LICENCA_DO_MAPA).catch(() => avisar('Não foi possível abrir o link.', 'erro'))}
            accessibilityRole="link"
            hitSlop={10}
            style={({ pressed }) => pressed && styles.pressed}
        >
            <Text style={styles.credito}>Mapa © colaboradores do OpenStreetMap</Text>
        </Pressable>
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

            <Conta />

            <View style={styles.contatos}>
                <Contato icone="instagram" texto="@praiometronit" url={CONTATO.instagram} />
                {CONTATO.email ? <Contato icone="envelope" texto="E-mail" url={`mailto:${CONTATO.email}`} /> : null}
            </View>

            <Text style={styles.rodape}>As informações são indicativas: siga sempre os guarda-vidas e a Defesa Civil.</Text>
            <CreditoDoMapa />
            <Text style={styles.versao}>Versão {env.appVersion}</Text>
        </Screen>
    );
}
