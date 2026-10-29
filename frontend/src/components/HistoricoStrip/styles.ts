import { StyleSheet } from 'react-native';
import { colors, spacing } from '../../theme';

export default StyleSheet.create({
    card: { gap: spacing.md },
    pct: { color: colors.text, fontSize: 14, fontWeight: '700' },
    barras: { flexDirection: 'row', gap: 3, height: 22 },
    barra: { flex: 1, borderRadius: 3 },
    propria: { backgroundColor: colors.success },
    impropria: { backgroundColor: colors.danger },
    rodape: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -spacing.xs },
    data: { color: colors.textSubtle, fontSize: 11 },
});
