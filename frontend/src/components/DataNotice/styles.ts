import { StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../../theme';

export default StyleSheet.create({
    box: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.sm,
        padding: spacing.md,
        borderRadius: radius.md,
        backgroundColor: colors.warningBg,
        borderWidth: 1,
        borderColor: 'rgba(255,212,92,0.4)',
    },
    text: { color: colors.text, fontSize: 13, flex: 1 },
});
