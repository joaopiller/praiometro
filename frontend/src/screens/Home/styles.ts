import { StyleSheet } from 'react-native';
import { temVidro } from '../../components/Vidro';
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
    fab: {
        position: 'absolute',
        right: spacing.lg,
        width: 46,
        height: 46,
        borderRadius: 23,
        // o vidro do iOS já tem a própria sombra
        ...(temVidro ? null : sombra),
    },
    fabToque: { flex: 1 },
    fabVidro: { flex: 1, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
    fabFundo: { backgroundColor: '#fff' },
    pressed: { opacity: 0.8 },
    carrossel: { position: 'absolute', left: 0, right: 0, bottom: 8, height: CARROSSEL_ALTURA - 8 },
    carrosselLista: { flexGrow: 0 },
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
