import { StyleSheet } from 'react-native';
import { colors, LOGO_PROPORCAO, radius, spacing } from '../../theme';

export default StyleSheet.create({
    bar: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: radius.lg,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.18)',
        paddingLeft: spacing.lg + 2,
        paddingRight: spacing.sm,
        paddingVertical: 10,
        minHeight: 72,
        shadowColor: '#00243D',
        shadowOpacity: 0.3,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 8,
    },
    barVidro: { borderWidth: 0, shadowOpacity: 0, elevation: 0 },
    logo: { width: 96, height: 96 / LOGO_PROPORCAO },
    clima: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        backgroundColor: 'rgba(255,255,255,0.14)',
        // raio interno = raio da barra - padding, para as curvas ficarem paralelas
        borderRadius: radius.lg - 10,
        paddingLeft: spacing.md,
        paddingRight: spacing.sm,
        paddingVertical: 8,
        minHeight: 52,
        flexShrink: 1,
    },
    pressed: { opacity: 0.8 },
    climaTexto: { flexShrink: 1, marginRight: 2 },
    temp: { color: colors.text, fontSize: 20, fontWeight: '800', lineHeight: 23 },
    condicao: { color: colors.textMuted, fontSize: 12, lineHeight: 15 },
});
