import { StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../../theme';

export default StyleSheet.create({
    container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xxl, gap: spacing.md },
    compact: { flex: 0, padding: spacing.sm, gap: spacing.sm, flexDirection: 'row' },
    selo: { width: 72, height: 72, marginBottom: spacing.xs },
    message: { color: colors.textMuted, fontSize: 16 },
    demora: { color: colors.textMuted, fontSize: 14, textAlign: 'center', lineHeight: 20 },
    title: { color: colors.text, fontSize: 17, fontWeight: '600', textAlign: 'center' },
    compactText: { fontSize: 14 },
    button: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        backgroundColor: colors.foam,
        paddingVertical: 10,
        paddingHorizontal: spacing.xl,
        borderRadius: radius.pill,
        marginTop: spacing.sm,
    },
    pressed: { opacity: 0.8 },
    buttonText: { color: colors.brand, fontWeight: '700', fontSize: 15 },
});
