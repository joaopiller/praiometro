import { StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

export default StyleSheet.create({
    hero: { alignItems: 'center', paddingTop: spacing.lg, paddingBottom: spacing.sm },
    city: { ...typography.title, fontSize: 17, fontWeight: '600' },
    zonas: {
        flexDirection: 'row',
        marginTop: spacing.md,
        padding: 3,
        borderRadius: radius.pill,
        backgroundColor: colors.surface,
        borderWidth: 1,
        borderColor: colors.border,
    },
    zona: { paddingVertical: 6, paddingHorizontal: spacing.lg, borderRadius: radius.pill },
    zonaAtiva: { backgroundColor: colors.sand },
    zonaTexto: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
    zonaTextoAtivo: { color: colors.brand },
    temperature: { ...typography.display, marginLeft: 22, marginTop: spacing.sm },
    condicao: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
    condicaoTexto: { ...typography.title, fontSize: 18, fontWeight: '600' },
    detalhes: { ...typography.body, marginTop: spacing.xs },
    updated: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
    updatedText: { color: colors.textMuted, fontSize: 13 },
});
