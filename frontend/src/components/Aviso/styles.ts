import { StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../../theme';

export default StyleSheet.create({
    aviso: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        paddingVertical: spacing.sm + 2,
        paddingHorizontal: spacing.md,
        borderRadius: radius.md,
        borderWidth: 1,
    },
    texto: { color: colors.text, fontSize: 14, flex: 1 },
});
