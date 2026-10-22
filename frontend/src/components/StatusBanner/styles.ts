import { StyleSheet } from 'react-native';
import { radius, spacing } from '../../theme';

export default StyleSheet.create({
    banner: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        borderRadius: radius.lg,
        padding: spacing.lg,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.25)',
    },
    iconCircle: {
        width: 52,
        height: 52,
        borderRadius: 26,
        backgroundColor: 'rgba(255,255,255,0.22)',
        alignItems: 'center',
        justifyContent: 'center',
    },
    texts: { flex: 1, gap: 2 },
    title: { color: '#fff', fontSize: 19, fontWeight: '800', lineHeight: 24 },
    subtitle: { color: 'rgba(255,255,255,0.9)', fontSize: 13, lineHeight: 18 },
    watermark: { position: 'absolute', right: -6, bottom: -10 },
});
