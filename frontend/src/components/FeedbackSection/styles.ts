import { StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../../theme';

export default StyleSheet.create({
    card: { gap: spacing.lg },
    summary: { flexDirection: 'row', alignItems: 'center', gap: spacing.lg },
    score: { color: colors.text, fontSize: 48, fontWeight: '800', lineHeight: 52, includeFontPadding: false },
    summaryRight: { gap: 4 },
    count: { color: colors.textMuted, fontSize: 13 },
    list: { gap: spacing.md },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    criterio: { color: colors.text, fontSize: 14, width: 110 },
    track: { flex: 1, height: 8, borderRadius: 4, backgroundColor: colors.surfaceStrong, overflow: 'hidden' },
    fill: { height: '100%', borderRadius: 4, backgroundColor: colors.star },
    value: { color: colors.text, fontSize: 14, fontWeight: '700', width: 30, textAlign: 'right' },
    emptyBox: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
    empty: { color: colors.textMuted, fontSize: 15, textAlign: 'center' },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        backgroundColor: colors.sand,
        borderRadius: radius.md,
        paddingVertical: 13,
    },
    pressed: { opacity: 0.85 },
    buttonText: { color: colors.brand, fontSize: 16, fontWeight: '800' },
    hint: { color: colors.textSubtle, fontSize: 12, textAlign: 'center', marginTop: -spacing.sm },
});
