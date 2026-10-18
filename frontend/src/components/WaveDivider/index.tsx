import Svg, { Path } from 'react-native-svg';
import { colors } from '../../theme';

interface Props {
    color?: string;
    height?: number;
    opacity?: number;
    /** onda "pendurada" embaixo de um bloco da mesma cor */
    invertida?: boolean;
}

export default function WaveDivider({ color = colors.bgMid, height = 28, opacity = 1, invertida }: Props) {
    return (
        <Svg
            width="100%"
            height={height}
            viewBox="0 0 400 40"
            preserveAspectRatio="none"
            accessible={false}
            style={invertida ? { transform: [{ scaleY: -1 }] } : undefined}
        >
            <Path
                d="M0 22 C 50 6, 100 6, 150 20 S 250 38, 300 22 S 370 4, 400 16 L400 40 L0 40 Z"
                fill={color}
                opacity={opacity * 0.45}
            />
            <Path d="M0 28 C 60 14, 120 16, 180 28 S 300 42, 400 24 L400 40 L0 40 Z" fill={color} opacity={opacity} />
        </Svg>
    );
}
