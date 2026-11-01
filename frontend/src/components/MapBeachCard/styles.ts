import { StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../../theme';

export default StyleSheet.create({
    card: {
        height: 96,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        padding: 10,
        borderRadius: radius.lg,
        borderWidth: 2,
        backgroundColor: '#fff',
        shadowColor: '#00243D',
        shadowOpacity: 0.22,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 4 },
        elevation: 6,
    },
    pressed: { opacity: 0.9 },
    foto: { width: 72, height: 72, borderRadius: radius.md },
    semFoto: { backgroundColor: '#E6F2FA', alignItems: 'center', justifyContent: 'center' },
    textos: { flex: 1, gap: 3 },
    nome: { fontSize: 16, fontWeight: '800', color: colors.bgBottom },
    local: { fontSize: 13, color: '#5B6B78' },
    seta: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#E6F2FA',
        alignItems: 'center',
        justifyContent: 'center',
    },
});
