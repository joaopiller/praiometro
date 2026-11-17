import { StyleSheet } from 'react-native';
import { colors, radius, spacing, tituloDaMarca } from '../../theme';

export default StyleSheet.create({
    card: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        padding: spacing.md,
        borderRadius: radius.lg,
        backgroundColor: colors.surface,
        borderColor: colors.border,
        borderWidth: 1,
    },
    pressed: { backgroundColor: colors.surfaceStrong },
    thumb: { width: 64, height: 64, borderRadius: radius.md },
    thumbPlaceholder: { backgroundColor: colors.sandSoft, alignItems: 'center', justifyContent: 'center' },
    texts: { flex: 1, gap: 4 },
    name: { color: colors.text, ...tituloDaMarca(15, 20) },
    location: { color: colors.textMuted, fontSize: 14 },
});
