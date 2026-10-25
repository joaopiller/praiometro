import { FontAwesome } from '@expo/vector-icons';
import { Pressable, View, type GestureResponderEvent } from 'react-native';
import { colors } from '../../theme';
import { formatNumber } from '../../utils/format';

interface Props {
    value: number;
    size?: number;
    /** torna clicável; tocar na metade esquerda dá meia estrela */
    onChange?: (valor: number) => void;
    label?: string;
    color?: string;
    emptyColor?: string;
}

function icone(value: number, estrela: number): 'star' | 'star-half-o' | 'star-o' {
    if (value >= estrela) return 'star';
    if (value >= estrela - 0.5) return 'star-half-o';
    return 'star-o';
}

export default function StarRating({ value, size = 24, onChange, label = 'Nota', color = colors.star, emptyColor = colors.starEmpty }: Props) {
    const passo = (delta: number) => onChange?.(Math.min(5, Math.max(0.5, (value || 0) + delta)));

    const tocar = (estrela: number) => (e: GestureResponderEvent) => {
        const metade = e.nativeEvent.locationX < size / 2;
        onChange?.(metade ? estrela - 0.5 : estrela);
    };

    return (
        <View
            style={{ flexDirection: 'row', gap: Math.round(size / 6) }}
            accessible
            accessibilityRole={onChange ? 'adjustable' : 'text'}
            accessibilityLabel={`${label}: ${formatNumber(value)} de 5 estrelas`}
            // Android só aceita inteiros em `now`, então a escala é em meias estrelas (0-10)
            accessibilityValue={{ min: 0, max: 10, now: Math.round(value * 2), text: `${formatNumber(value)} estrelas` }}
            accessibilityActions={onChange ? [{ name: 'increment' }, { name: 'decrement' }] : undefined}
            onAccessibilityAction={(e) => passo(e.nativeEvent.actionName === 'increment' ? 0.5 : -0.5)}
        >
            {[1, 2, 3, 4, 5].map((estrela) => {
                const nome = icone(value, estrela);
                const conteudo = (
                    <FontAwesome name={nome} size={size} color={nome === 'star-o' ? emptyColor : color} />
                );
                return onChange ? (
                    <Pressable key={estrela} onPress={tocar(estrela)} hitSlop={4} testID={`estrela-${estrela}`}>
                        {conteudo}
                    </Pressable>
                ) : (
                    <View key={estrela}>{conteudo}</View>
                );
            })}
        </View>
    );
}
