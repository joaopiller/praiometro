import { StyleSheet } from 'react-native';
import { colors, spacing } from '../../theme';

export default StyleSheet.create({
    card: { gap: spacing.md },
    resumo: { color: colors.textMuted, fontSize: 14, lineHeight: 20, marginTop: 2 },
    pct: { color: colors.text, fontWeight: '700' },
    barras: { flexDirection: 'row', alignItems: 'flex-end', gap: 3, height: 24 },
    barra: { flex: 1, borderRadius: 3 },
    propria: { height: '100%', backgroundColor: colors.success },
    // mais baixa, para não depender só da cor
    impropria: { height: '55%', backgroundColor: colors.danger },
    semDado: { height: '55%', backgroundColor: 'rgba(255,255,255,0.16)' },
    rodape: { flexDirection: 'row', justifyContent: 'space-between', marginTop: -spacing.xs },
    data: { color: colors.textSubtle, fontSize: 12 },
});
