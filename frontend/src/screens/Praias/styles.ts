import { StyleSheet } from 'react-native';
import { CONTENT_MAX_WIDTH, colors, radius, spacing } from '../../theme';

export default StyleSheet.create({
    list: { padding: spacing.lg, paddingBottom: spacing.xxl, width: '100%', maxWidth: CONTENT_MAX_WIDTH, alignSelf: 'center' },
    header: { gap: spacing.md, marginBottom: spacing.lg },
    search: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        borderRadius: radius.pill,
        paddingHorizontal: spacing.lg,
        height: 48,
    },
    searchFundo: { backgroundColor: colors.surfaceStrong, borderColor: colors.border, borderWidth: 1 },
    input: { flex: 1, color: colors.text, fontSize: 16 },
    // a rolagem vai até a borda da tela; os filtros continuam alinhados com o conteúdo
    chipsRolagem: { marginHorizontal: -spacing.lg },
    chips: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 5,
        paddingHorizontal: 12,
        paddingVertical: 7,
        borderRadius: radius.pill,
        borderWidth: 1,
        borderColor: colors.border,
        backgroundColor: colors.surface,
    },
    aviso: { color: colors.warning, fontSize: 13 },
    chipActive: { backgroundColor: colors.sand, borderColor: colors.sand },
    chipText: { color: colors.text, fontWeight: '600' },
    chipTextActive: { color: colors.brand },
    secao: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginTop: spacing.sm },
    secaoTitulo: { color: colors.text, fontSize: 18, fontWeight: '800' },
    secaoTotal: { color: colors.textSubtle, fontSize: 13 },
    separator: { height: spacing.md },
    empty: { color: colors.textMuted, fontSize: 16, textAlign: 'center', marginTop: spacing.xl },
});
