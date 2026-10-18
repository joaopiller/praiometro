import type { ReactNode } from 'react';
import { Text, View, type StyleProp, type ViewStyle } from 'react-native';
import styles from './styles';

interface Props {
    children: ReactNode;
    style?: StyleProp<ViewStyle>;
    accessibilityLabel?: string;
}

export default function GlassCard({ children, style, accessibilityLabel }: Props) {
    return (
        <View style={[styles.card, style]} accessible={!!accessibilityLabel} accessibilityLabel={accessibilityLabel}>
            {children}
        </View>
    );
}

interface LabelProps {
    children: string;
    icon?: ReactNode;
    right?: ReactNode;
}

export function CardLabel({ children, icon, right }: LabelProps) {
    return (
        <View style={styles.labelRow}>
            <View style={styles.labelLeft}>
                {icon}
                <Text style={styles.label} accessibilityRole="header">
                    {children.toUpperCase()}
                </Text>
            </View>
            {right}
        </View>
    );
}
