import { memo } from 'react';
import { Text, View } from 'react-native';
import type { Historico } from '../../api/types';
import { formatDate } from '../../utils/format';
import GlassCard, { CardLabel } from '../GlassCard';
import styles from './styles';

const ULTIMAS = 24;

interface Props {
    historico?: Historico;
    trecho?: string;
    carregando?: boolean;
    /** a consulta falhou (sem internet, servidor fora): não é o mesmo que não haver coletas */
    erro?: boolean;
}

function HistoricoStrip({ historico, trecho, carregando, erro }: Props) {
    const titulo = <CardLabel>Banho nas últimas coletas</CardLabel>;

    if (!historico?.total) {
        // com vários trechos o cartão fica no lugar mesmo vazio, senão a tela pula a cada toque
        if (!carregando && !erro && !trecho) return null;
        const aviso = carregando
            ? 'Carregando o histórico...'
            : erro
              ? 'Não foi possível carregar o histórico'
              : 'Sem coletas registradas';
        return (
            <GlassCard style={styles.card} accessibilityLabel={`Histórico${trecho ? ` de ${trecho}` : ''}: ${aviso}`}>
                <View>
                    {titulo}
                    <Text style={styles.resumo}>
                        {aviso}
                        {trecho ? ` · ${trecho}` : ''}
                    </Text>
                </View>
                <View style={styles.barras}>
                    {Array.from({ length: ULTIMAS }, (_, i) => (
                        <View key={i} style={[styles.barra, styles.semDado]} />
                    ))}
                </View>
                <View style={styles.rodape}>
                    <Text style={styles.data}> </Text>
                </View>
            </GlassCard>
        );
    }

    const ultimas = historico.registros.slice(-ULTIMAS);
    const pct = Math.round(historico.percentual_proprio ?? 0);
    const primeira = ultimas[0]?.data;
    const ultima = ultimas[ultimas.length - 1]?.data;

    return (
        <GlassCard
            style={styles.card}
            accessibilityLabel={`Histórico${trecho ? ` de ${trecho}` : ''}: própria para banho em ${pct}% das coletas dos últimos 12 meses`}
        >
            <View>
                {titulo}
                {/* o percentual vai embaixo do título: ao lado, os dois se encostavam em telas estreitas */}
                <Text style={styles.resumo}>
                    <Text style={styles.pct}>{pct}% própria</Text>
                    {trecho ? ` · ${trecho}` : ''}
                </Text>
            </View>
            <View style={styles.barras}>
                {ultimas.map((r) => (
                    <View key={r.data} style={[styles.barra, r.propria ? styles.propria : styles.impropria]} />
                ))}
            </View>
            <View style={styles.rodape}>
                <Text style={styles.data}>{formatDate(`${primeira}T00:00`)}</Text>
                <Text style={styles.data}>{formatDate(`${ultima}T00:00`)}</Text>
            </View>
        </GlassCard>
    );
}

export default memo(HistoricoStrip);
