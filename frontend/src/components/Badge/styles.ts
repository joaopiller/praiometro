import { StyleSheet } from 'react-native';
import { radius } from '../../theme';

export default StyleSheet.create({
    badge: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 5,
        paddingHorizontal: 9,
        paddingVertical: 4,
        borderRadius: radius.sm,
        borderWidth: 1,
    },
    text: { fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },
});
