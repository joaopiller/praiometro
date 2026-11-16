import { StyleSheet } from 'react-native';
import { radius, spacing } from '../../theme';

export default StyleSheet.create({
    camada: { position: 'absolute', left: spacing.lg, right: spacing.lg, alignItems: 'center', zIndex: 900, elevation: 20 },
    aviso: {
        width: '100%',
        maxWidth: 520,
        flexDirection: 'row',
        alignItems: 'center',
        gap: spacing.md,
        paddingVertical: spacing.md,
        paddingHorizontal: spacing.lg,
        borderRadius: radius.lg,
        borderWidth: 1,
        backgroundColor: '#0E2D45',
        shadowColor: '#00121F',
        shadowOpacity: 0.35,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 6 },
    },
    texto: { color: '#FFFFFF', fontSize: 15, lineHeight: 20, flex: 1 },
});
