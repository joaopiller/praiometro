import { StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

export default StyleSheet.create({
    card: {
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderWidth: StyleSheet.hairlineWidth * 2,
        borderRadius: radius.lg,
        padding: spacing.lg + 2,
        overflow: 'hidden',
    },
    labelRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: 24 },
    labelLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    label: typography.label,
});
