import { memo } from 'react';
import { Text, View } from 'react-native';
import type { Historico } from '../../api/types';
import { formatDate } from '../../utils/format';
import GlassCard, { CardLabel } from '../GlassCard';
import styles from './styles';

const ULTIMAS = 24;

function HistoricoStrip({ historico, trecho }: { historico?: Historico; trecho?: string }) {
    if (!historico?.total) return null;
    const ultimas = historico.registros.slice(-ULTIMAS);
    const pct = Math.round(historico.percentual_proprio ?? 0);
    const primeira = ultimas[0]?.data;
    const ultima = ultimas[ultimas.length - 1]?.data;

    return (
        <GlassCard
            style={styles.card}
            accessibilityLabel={`Histórico${trecho ? ` de ${trecho}` : ''}: própria em ${pct}% das coletas dos últimos 12 meses`}
        >
            <View>
                <CardLabel right={<Text style={styles.pct}>{pct}% própria</Text>}>Banho nas últimas coletas</CardLabel>
                {trecho ? <Text style={styles.trecho}>{trecho}</Text> : null}
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
