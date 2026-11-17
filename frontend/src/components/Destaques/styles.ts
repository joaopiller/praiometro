import { StyleSheet } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme';

export default StyleSheet.create({
    lista: { gap: spacing.md },
    cartao: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: spacing.md,
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderWidth: StyleSheet.hairlineWidth * 2,
        borderRadius: radius.lg,
        padding: spacing.lg,
    },
    cartaoAviso: { borderColor: 'rgba(255,212,92,0.55)', backgroundColor: colors.warningBg },
    // o sol da marca: círculo cor de areia com o desenho em azul
    circulo: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: colors.sand,
        alignItems: 'center',
        justifyContent: 'center',
    },
    textos: { flex: 1, gap: 3 },
    rotulo: { ...typography.label },
    rotuloAviso: { color: colors.warning },
    texto: { color: colors.text, fontSize: 15, lineHeight: 21 },
    rodape: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.xs },
    pontos: { flexDirection: 'row', gap: 5 },
    ponto: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.textSubtle },
    pontoAtivo: { backgroundColor: colors.sand },
    outra: { color: colors.textMuted, fontSize: 12 },
    pressionado: { opacity: 0.85 },
});
