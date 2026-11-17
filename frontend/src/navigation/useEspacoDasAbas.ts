import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ALTURA_BARRA, baseDaBarra } from './BarraDeAbas';

// altura da barra de abas do iOS acima da área segura (no iPad ela fica no topo)
const BARRA_ABAS_IPHONE = 49;

/**
 * Espaço que a barra de abas cobre embaixo da tela. Nos dois sistemas ela flutua por cima do
 * conteúdo: no iOS é a do sistema; no Android, a desenhada em BarraDeAbas.
 */
export function useEspacoDasAbas() {
    const insets = useSafeAreaInsets();
    if (Platform.OS !== 'ios') return baseDaBarra(insets.bottom) + ALTURA_BARRA;
    return insets.bottom + (Platform.isPad ? 0 : BARRA_ABAS_IPHONE);
}
