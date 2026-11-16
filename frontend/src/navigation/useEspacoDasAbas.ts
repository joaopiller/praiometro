import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// altura da barra de abas do iOS acima da área segura (no iPad ela fica no topo)
const BARRA_ABAS_IPHONE = 49;

/**
 * Espaço que a barra de abas cobre embaixo da tela. No iOS a barra é a do sistema e flutua
 * por cima do conteúdo; no Android ela fica fora da tela, então não cobre nada.
 */
export function useEspacoDasAbas() {
    const insets = useSafeAreaInsets();
    if (Platform.OS !== 'ios') return 0;
    return insets.bottom + (Platform.isPad ? 0 : BARRA_ABAS_IPHONE);
}
