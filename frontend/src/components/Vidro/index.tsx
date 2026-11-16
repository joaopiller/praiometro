import { GlassView, isLiquidGlassAvailable } from 'expo-glass-effect';
import { View, type ColorValue, type StyleProp, type ViewProps, type ViewStyle } from 'react-native';

const temVidro = isLiquidGlassAvailable();

type Props = ViewProps & {
    /** estilo usado quando não há Liquid Glass (Android e iOS antes do 26) */
    semVidro?: StyleProp<ViewStyle>;
    tintColor?: ColorValue;
    /** reage ao toque, como os botões do sistema */
    interativo?: boolean;
    claro?: boolean;
    /** vidro escuro, para superfícies sobre o fundo azul do app */
    escuro?: boolean;
};

/** Superfície de vidro do iOS 26; nos outros sistemas, uma View comum com o estilo `semVidro`. */
export default function Vidro({ style, semVidro, tintColor, interativo, claro, escuro, ...props }: Props) {
    if (!temVidro) return <View style={[style, semVidro]} {...props} />;
    return (
        <GlassView
            style={style}
            glassEffectStyle={claro ? 'clear' : 'regular'}
            tintColor={tintColor}
            isInteractive={interativo}
            colorScheme={escuro ? 'dark' : 'auto'}
            {...props}
        />
    );
}

export { temVidro };
