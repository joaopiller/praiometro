import { StyleSheet } from 'react-native';
import { colors, spacing } from '../../theme';

export const COLUMN_WIDTH = 64;
export const CHART_HEIGHT = 56;

export default StyleSheet.create({
    card: { paddingHorizontal: 0, gap: spacing.md },
    header: { paddingHorizontal: spacing.lg },
    scroll: { paddingHorizontal: spacing.sm },
    row: { flexDirection: 'row' },
    column: { width: COLUMN_WIDTH, alignItems: 'center', gap: 6 },
    hour: { color: colors.textMuted, fontSize: 12, fontWeight: '600', fontVariant: ['tabular-nums'] },
    temp: { color: colors.text, fontSize: 17, fontWeight: '700', fontVariant: ['tabular-nums'] },
    rainRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
    rain: { color: colors.accent, fontSize: 12 },
    hint: { color: colors.textSubtle, fontSize: 12, textAlign: 'center' },
});
