import { StyleSheet } from 'react-native';
import { spacing, typography } from '../../theme';

export default StyleSheet.create({
    card: { flex: 1, gap: spacing.md, minHeight: 148 },
    valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
    value: typography.value,
    unit: typography.unit,
    nota: { ...typography.title, fontSize: 17, lineHeight: 22 },
    footer: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 'auto' },
    footerText: { ...typography.body, fontSize: 14, lineHeight: 19, flexShrink: 1 },
});
