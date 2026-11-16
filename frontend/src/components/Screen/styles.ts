import { StyleSheet } from 'react-native';
import { CONTENT_MAX_WIDTH, colors, spacing } from '../../theme';

export default StyleSheet.create({
    root: { flex: 1, backgroundColor: colors.bgBottom },
    gradient: StyleSheet.absoluteFill,
    flex: { flex: 1 },
    content: {
        paddingHorizontal: spacing.lg,
        paddingBottom: spacing.xxl,
        gap: spacing.lg,
        width: '100%',
        maxWidth: CONTENT_MAX_WIDTH,
        alignSelf: 'center',
    },
});
