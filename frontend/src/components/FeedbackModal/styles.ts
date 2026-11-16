import { StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../../theme';

export default StyleSheet.create({
    backdrop: { flex: 1, backgroundColor: 'rgba(1,30,50,0.65)', justifyContent: 'center', alignItems: 'center', padding: spacing.lg },
    container: {
        width: '100%',
        maxWidth: 440,
        backgroundColor: '#FDFBF6',
        borderRadius: radius.lg,
        padding: spacing.xl,
        gap: spacing.lg,
    },
    title: { fontSize: 20, fontWeight: '800', color: colors.brand, textAlign: 'center' },
    subtitle: { fontSize: 14, color: '#5B6B78', textAlign: 'center', marginTop: -spacing.sm },
    list: { gap: spacing.md },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    criterio: { fontSize: 15, color: '#33424D' },
    erro: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        padding: spacing.md,
        borderRadius: radius.md,
        backgroundColor: '#FDECEA',
    },
    erroTexto: { color: '#8A1C14', fontSize: 14, flex: 1 },
    pending: { fontSize: 13, color: colors.brand, textAlign: 'center', fontWeight: '600' },
    buttons: { flexDirection: 'row', gap: spacing.md },
    secondary: { flex: 1, paddingVertical: 13, borderRadius: radius.md, backgroundColor: '#E5ECF2', alignItems: 'center' },
    secondaryText: { color: colors.brand, fontSize: 16, fontWeight: '700' },
    primary: { flex: 1, paddingVertical: 13, borderRadius: radius.md, backgroundColor: colors.brand, alignItems: 'center' },
    primaryText: { color: '#fff', fontSize: 16, fontWeight: '700' },
    disabled: { opacity: 0.45 },
    pressed: { opacity: 0.85 },
});
