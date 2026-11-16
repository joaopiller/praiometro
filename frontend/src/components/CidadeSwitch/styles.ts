import { StyleSheet } from 'react-native';
import { colors, radius } from '../../theme';

export default StyleSheet.create({
    caixa: { flexDirection: 'row', alignSelf: 'center', padding: 3, borderRadius: radius.pill, overflow: 'hidden' },
    fundoMapa: {
        backgroundColor: 'rgba(255,255,255,0.94)',
        shadowColor: '#00243D',
        shadowOpacity: 0.18,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 3 },
        elevation: 4,
    },
    fundoTela: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    opcao: { minWidth: 92, alignItems: 'center', paddingVertical: 7, paddingHorizontal: 16, borderRadius: radius.pill },
    ativaMapa: { backgroundColor: colors.brand },
    ativaTela: { backgroundColor: colors.sand },
    texto: { fontSize: 14, fontWeight: '700' },
    textoMapa: { color: colors.brand },
    textoTela: { color: colors.textMuted },
    textoAtivoMapa: { color: '#fff' },
    textoAtivoTela: { color: colors.brand },
});
