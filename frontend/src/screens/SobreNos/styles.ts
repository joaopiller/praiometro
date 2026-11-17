import { StyleSheet } from 'react-native';
import { colors, radius, spacing, typography, tituloDaMarca } from '../../theme';

export default StyleSheet.create({
    conteudo: { paddingTop: spacing.lg },
    card: { gap: spacing.md },
    titulo: { color: colors.text, ...tituloDaMarca(21, 28) },
    texto: { ...typography.body, flexShrink: 1 },
    forte: { color: colors.text, fontWeight: '700' },
    legenda: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
    ponto: { width: 12, height: 12, borderRadius: 6, marginTop: 5, borderWidth: 2, borderColor: '#fff' },
    dica: { ...typography.caption, fontSize: 13, lineHeight: 19, color: colors.textMuted },
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
    sair: {
        alignSelf: 'flex-start',
        minHeight: 44,
        justifyContent: 'center',
        paddingHorizontal: spacing.lg,
        borderRadius: radius.md,
        borderWidth: 1,
        borderColor: colors.border,
    },
    sairTexto: { color: colors.text, fontSize: 15, fontWeight: '600' },
    botaoTexto: { fontSize: 15, fontWeight: '700', color: colors.brand },
    rodape: { ...typography.caption, textAlign: 'center', lineHeight: 18, paddingHorizontal: spacing.lg },
    credito: { ...typography.caption, textAlign: 'center', textDecorationLine: 'underline' },
    versao: { ...typography.caption, textAlign: 'center' },
});
