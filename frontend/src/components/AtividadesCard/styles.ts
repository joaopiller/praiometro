import { StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../../theme';

export default StyleSheet.create({
    card: { gap: spacing.md },
    lista: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    chip: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingVertical: 7,
        paddingHorizontal: 12,
        borderRadius: radius.pill,
        backgroundColor: colors.surfaceStrong,
    },
    chipTexto: { color: colors.text, fontSize: 14, fontWeight: '600' },
    criancas: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    divisoria: {
        paddingTop: spacing.md,
        borderTopWidth: StyleSheet.hairlineWidth,
        borderTopColor: colors.border,
    },
    criancasIcone: {
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: colors.successBg,
    },
    criancasTextos: { flex: 1, gap: 2 },
    criancasTitulo: { color: colors.success, fontSize: 15, fontWeight: '800' },
    criancasMotivo: { color: colors.textMuted, fontSize: 14, lineHeight: 19 },
});
