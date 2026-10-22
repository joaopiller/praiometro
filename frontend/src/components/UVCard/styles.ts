import { StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../theme';

export default StyleSheet.create({
    card: { flexDirection: 'row', gap: spacing.lg },
    content: { flex: 1, gap: spacing.md },
    valueRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    value: typography.value,
    tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
    tip: { ...typography.body, flexShrink: 1 },
    scale: { width: 14, alignItems: 'center', justifyContent: 'center', paddingVertical: 4 },
    bar: { width: 6, flex: 1, borderRadius: 3 },
    marker: {
        position: 'absolute',
        width: 14,
        height: 14,
        borderRadius: 7,
        marginBottom: -7,
        backgroundColor: colors.text,
        borderWidth: 3,
        borderColor: colors.bgMid,
    },
});
