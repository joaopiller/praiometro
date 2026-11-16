import { StyleSheet } from 'react-native';
import { radius, spacing } from '../../theme';

export const FOLHA = {
    fundo: '#FDFBF6',
    texto: '#24323C',
    textoSuave: '#5B6B78',
    opcao: '#EEF3F7',
    opcaoPressionada: '#DCE7EF',
};

export default StyleSheet.create({
    fundo: { flex: 1, backgroundColor: 'rgba(1,30,50,0.6)', justifyContent: 'flex-end' },
    folha: {
        backgroundColor: FOLHA.fundo,
        borderTopLeftRadius: radius.lg + 4,
        borderTopRightRadius: radius.lg + 4,
        paddingHorizontal: spacing.xl,
        paddingTop: spacing.sm,
        width: '100%',
        maxWidth: 560,
        alignSelf: 'center',
    },
    alca: {
        alignSelf: 'center',
        width: 40,
        height: 5,
        borderRadius: 3,
        backgroundColor: '#C9D3DB',
        marginBottom: spacing.lg,
    },
});
