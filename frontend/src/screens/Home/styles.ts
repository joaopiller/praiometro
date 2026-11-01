import { StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../../theme';

export const CARROSSEL_ALTURA = 112;
export const CARD_GAP = 12;

const sombra = {
    shadowColor: '#00243D',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
};

export default StyleSheet.create({
    container: { flex: 1, backgroundColor: '#AAD3F0' },
    map: { flex: 1 },
    scrim: { position: 'absolute', top: 0, left: 0, right: 0 },
    top: { position: 'absolute', top: 0, left: 0, right: 0, paddingHorizontal: spacing.md, gap: spacing.sm },
    legenda: {
        flexDirection: 'row',
        alignSelf: 'flex-start',
        gap: spacing.md,
        backgroundColor: 'rgba(255,255,255,0.92)',
        paddingHorizontal: spacing.md,
        paddingVertical: 6,
        borderRadius: radius.pill,
        ...sombra,
        shadowOpacity: 0.12,
    },
    legendaItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    legendaPonto: { width: 10, height: 10, borderRadius: 5, borderWidth: 1.5, borderColor: '#fff' },
    legendaTexto: { fontSize: 12, fontWeight: '600', color: colors.bgBottom },
    fab: {
        position: 'absolute',
        right: spacing.lg,
        width: 46,
        height: 46,
        borderRadius: 23,
        backgroundColor: '#fff',
        alignItems: 'center',
        justifyContent: 'center',
        ...sombra,
    },
    pressed: { opacity: 0.8 },
    carrossel: { position: 'absolute', left: 0, right: 0, bottom: 8, height: CARROSSEL_ALTURA - 8, flexGrow: 0 },
    mapError: {
        position: 'absolute',
        left: spacing.lg,
        right: spacing.lg,
        top: '45%',
        backgroundColor: colors.dangerSolid,
        borderRadius: radius.md,
        padding: spacing.md,
    },
    mapErrorText: { color: '#fff', fontWeight: '600', textAlign: 'center' },
});
