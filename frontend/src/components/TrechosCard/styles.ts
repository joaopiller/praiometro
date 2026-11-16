import { StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../../theme';

export default StyleSheet.create({
    card: { gap: spacing.sm },
    ajuda: { color: colors.textMuted, fontSize: 13, lineHeight: 18, marginBottom: spacing.xs },
    linha: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingVertical: 12,
        paddingHorizontal: spacing.sm,
        marginHorizontal: -spacing.sm,
        borderRadius: radius.md,
    },
    divisoria: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
    ativa: { backgroundColor: colors.surfaceStrong, borderTopColor: 'transparent' },
    pressionada: { opacity: 0.75 },
    ponto: { width: 12, height: 12, borderRadius: 6, borderWidth: 2, borderColor: 'rgba(255,255,255,0.85)' },
    nome: { flex: 1, color: colors.textMuted, fontSize: 15 },
    nomeAtivo: { color: colors.text, fontWeight: '700' },
    situacao: { fontSize: 13, fontWeight: '800' },
});
