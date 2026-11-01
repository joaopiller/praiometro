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
        paddingVertical: spacing.sm,
        minHeight: 56,
        shadowColor: '#00243D',
        shadowOpacity: 0.3,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 8,
    },
    logo: { width: 96, height: 96 / LOGO_PROPORCAO },
    clima: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255,255,255,0.14)',
        // raio interno = raio da barra - padding, para as curvas ficarem paralelas
        borderRadius: radius.lg - spacing.sm,
        paddingHorizontal: spacing.md,
        paddingVertical: 8,
        flexShrink: 1,
    },
    pressed: { opacity: 0.8 },
    temp: { color: colors.text, fontSize: 18, fontWeight: '800' },
    condicao: { color: colors.textMuted, fontSize: 13, flexShrink: 1 },
});
