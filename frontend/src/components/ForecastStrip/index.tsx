import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useMemo } from 'react';
import { ScrollView, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import type { PrevisaoHora } from '../../api/types';
import { colors } from '../../theme';
import { formatHour, formatTemp, parseTimestamp } from '../../utils/format';
import { getCondicao } from '../../utils/weather';
import GlassCard, { CardLabel } from '../GlassCard';
import WeatherIcon from '../WeatherIcon';
import styles, { COLUMN_WIDTH, CHART_HEIGHT } from './styles';

interface Props {
    previsao: PrevisaoHora[];
    title?: string;
}

/** Curva suave (Catmull-Rom → Bézier) passando pelos pontos. */
function caminhoSuave(pontos: { x: number; y: number }[]): string {
    if (pontos.length < 2) return '';
    let d = `M ${pontos[0].x} ${pontos[0].y}`;
    for (let i = 0; i < pontos.length - 1; i++) {
        const p0 = pontos[i - 1] ?? pontos[i];
        const p1 = pontos[i];
        const p2 = pontos[i + 1];
        const p3 = pontos[i + 2] ?? p2;
        const c1x = p1.x + (p2.x - p0.x) / 6;
        const c1y = p1.y + (p2.y - p0.y) / 6;
        const c2x = p2.x - (p3.x - p1.x) / 6;
        const c2y = p2.y - (p3.y - p1.y) / 6;
        d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
    }
    return d;
}

/** "17:00, 24°, garoa, 96% de chance de chuva" */
function descreverHora(p: PrevisaoHora): string {
    return [
        formatHour(p.hora),
        formatTemp(p.temperature_2m),
        p.weather_code != null ? getCondicao(p.weather_code).descricao : null,
        p.precipitation_probability != null ? `${p.precipitation_probability}% de chance de chuva` : null,
    ]
        .filter(Boolean)
        .join(', ');
}

export default function ForecastStrip({ previsao, title = 'Previsão próximas 24h' }: Props) {
    const itens = previsao.slice(0, 24);
    const largura = itens.length * COLUMN_WIDTH;

    const pontos = useMemo(() => {
        const temps = itens.map((p) => p.temperature_2m).filter((t): t is number => t !== null);
        if (temps.length < 2) return [];
        const min = Math.min(...temps);
        const max = Math.max(...temps);
        const faixa = max - min || 1;
        return itens.flatMap((p, i) =>
            p.temperature_2m === null
                ? []
                : [{ x: i * COLUMN_WIDTH + COLUMN_WIDTH / 2, y: 8 + (1 - (p.temperature_2m - min) / faixa) * (CHART_HEIGHT - 16) }],
        );
    }, [itens]);

    if (!itens.length) return null;

    return (
        <GlassCard style={styles.card}>
            <View style={styles.header}>
                <CardLabel icon={<Feather name="clock" size={16} color={colors.label} />}>{title}</CardLabel>
            </View>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scroll}
                accessibilityLabel="Previsão por hora. Deslize para ver mais horas."
            >
                <View style={{ width: largura }}>
                    <View style={styles.row}>
                        {itens.map((p) => (
                            <View key={p.hora} style={styles.column} accessible accessibilityLabel={descreverHora(p)}>
                                <Text style={styles.hour}>{formatHour(p.hora)}</Text>
                                <WeatherIcon code={p.weather_code} size={26} hour={parseTimestamp(p.hora)?.hora} />
                                <Text style={styles.temp}>{formatTemp(p.temperature_2m)}</Text>
                            </View>
                        ))}
                    </View>
                    {pontos.length > 1 && (
                        <Svg width={largura} height={CHART_HEIGHT} accessible={false}>
                            <Path d={caminhoSuave(pontos)} stroke={colors.foam} strokeWidth={2.5} fill="none" />
                            {pontos.map((pt) => (
                                <Circle key={pt.x} cx={pt.x} cy={pt.y} r={3.5} fill={colors.text} />
                            ))}
                        </Svg>
                    )}
                    {/* a chuva já vai no rótulo de cada hora, acima */}
                    <View style={styles.row} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                        {itens.map((p) => (
                            <View key={p.hora} style={styles.column}>
                                <View style={styles.rainRow}>
                                    <MaterialCommunityIcons name="water" size={11} color={colors.accent} />
                                    <Text style={styles.rain}>
                                        {p.precipitation_probability != null ? `${p.precipitation_probability}%` : '–'}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>
                </View>
            </ScrollView>
            <Text style={styles.hint}>Deslize para ver mais horas</Text>
        </GlassCard>
    );
}
