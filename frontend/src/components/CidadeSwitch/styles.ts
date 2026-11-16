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
    opcao: { minWidth: 92, alignItems: 'center', paddingVertical: 8, paddingHorizontal: 16, borderRadius: radius.pill },
    // fica atrás dos textos e acompanha a opção escolhida; a folga é a mesma da caixa
    marcador: { position: 'absolute', top: 3, bottom: 3, borderRadius: radius.pill },
    ativaMapa: { backgroundColor: colors.brand },
    ativaTela: { backgroundColor: colors.sand },
    texto: { fontSize: 14, fontWeight: '700' },
});
