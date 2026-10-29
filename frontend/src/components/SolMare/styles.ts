import { StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../theme';

export default StyleSheet.create({
    linha: { flexDirection: 'row', gap: spacing.md },
    card: { flex: 1, gap: spacing.sm },
    item: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    hora: { color: colors.text, fontSize: 20, fontWeight: '700', fontVariant: ['tabular-nums'] },
    tendencia: { ...typography.title, fontSize: 20 },
    detalhe: { ...typography.body, fontSize: 14 },
});
