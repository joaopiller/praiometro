import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { RefreshControl, ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import { useEspacoDasAbas } from '../../navigation/useEspacoDasAbas';
import { colors } from '../../theme';
import styles from './styles';

interface Props {
    children: ReactNode;
    scroll?: boolean;
    refreshing?: boolean;
    onRefresh?: () => void;
    contentStyle?: StyleProp<ViewStyle>;
}

export default function Screen({ children, scroll = true, refreshing = false, onRefresh, contentStyle }: Props) {
    const espacoAbas = useEspacoDasAbas();
    return (
        <View style={styles.root}>
            <LinearGradient
                colors={[colors.bgTop, colors.bgMid, colors.bgBottom]}
                locations={[0, 0.45, 1]}
                style={styles.gradient}
            />
            {scroll ? (
                <ScrollView
                    contentContainerStyle={[styles.content, contentStyle, espacoAbas > 0 && { paddingBottom: espacoAbas + 32 }]}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                    refreshControl={
                        onRefresh ? (
                            <RefreshControl
                                refreshing={refreshing}
                                onRefresh={onRefresh}
                                tintColor={colors.text}
                                colors={[colors.brand]}
                            />
                        ) : undefined
                    }
                >
                    {children}
                </ScrollView>
            ) : (
                <View style={[styles.flex, contentStyle]}>{children}</View>
            )}
        </View>
    );
}
