import { StyleSheet } from 'react-native';
import { colors, spacing, typography } from '../../theme';

export default StyleSheet.create({
    hero: { alignItems: 'center', paddingTop: spacing.lg, paddingBottom: spacing.sm },
    city: { ...typography.title, fontSize: 17, fontWeight: '600' },
    temperature: { ...typography.display, marginLeft: 22, marginTop: spacing.xs },
    condicao: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
    condicaoTexto: { ...typography.title, fontSize: 18, fontWeight: '600' },
    detalhes: { ...typography.body, marginTop: spacing.xs },
    updated: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 },
    updatedText: { color: colors.textMuted, fontSize: 13 },
});
