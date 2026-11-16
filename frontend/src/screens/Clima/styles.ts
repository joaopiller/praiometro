import { StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../theme';

export default StyleSheet.create({
    heroSozinho: { paddingHorizontal: spacing.lg },
    hero: { alignItems: 'center', paddingTop: spacing.lg, paddingBottom: spacing.xl },
    // áreas da cidade: abas leves, para não repetir o visual do seletor de cidade
    zonas: { flexDirection: 'row', gap: spacing.lg, marginTop: spacing.md },
    zona: { paddingVertical: 8, borderBottomWidth: 2, borderBottomColor: 'transparent' },
    zonaAtiva: { borderBottomColor: colors.sand },
    zonaTexto: { color: colors.textMuted, fontSize: 14, fontWeight: '600' },
    zonaTextoAtivo: { color: colors.text },
    temperature: { ...typography.display, marginLeft: 22, marginTop: spacing.lg },
    condicao: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
    condicaoTexto: { ...typography.title, fontSize: 18, fontWeight: '600' },
    detalhes: { ...typography.body, marginTop: spacing.xs },
    updated: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
    updatedText: { color: colors.textMuted, fontSize: 13 },
});
