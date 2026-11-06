import { StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

export default StyleSheet.create({
    conteudo: { paddingTop: spacing.lg },
    card: { gap: spacing.md },
    titulo: { ...typography.title, fontSize: 22, lineHeight: 28 },
    texto: { ...typography.body, flexShrink: 1 },
    forte: { color: colors.text, fontWeight: '700' },
    equipe: { ...typography.caption, fontSize: 13, lineHeight: 18, color: colors.textMuted },
    legenda: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
    ponto: { width: 12, height: 12, borderRadius: 6, marginTop: 5, borderWidth: 2, borderColor: '#fff' },
    dica: { ...typography.caption, fontSize: 13, lineHeight: 19, color: colors.textMuted },
    fonte: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
    fonteDetalhe: { ...typography.body, fontSize: 14, textAlign: 'right', flexShrink: 1 },
    contatos: { flexDirection: 'row', gap: spacing.md },
    botao: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: spacing.sm,
        backgroundColor: colors.sand,
        minHeight: 50,
        borderRadius: radius.md,
    },
    pressed: { opacity: 0.85 },
    botaoTexto: { fontSize: 15, fontWeight: '700', color: colors.brand },
    rodape: { ...typography.caption, textAlign: 'center', lineHeight: 18, paddingHorizontal: spacing.lg },
    versao: { ...typography.caption, textAlign: 'center', marginTop: spacing.md },
});
