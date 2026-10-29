import { LinearGradient } from 'expo-linear-gradient';
import { Image } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme';
import styles from './styles';

const logo = require('../../../assets/images/logo-header.png');

// o degradê termina na cor em que o fundo das telas começa, sem emenda
export default function CustomHeader() {
    const insets = useSafeAreaInsets();
    return (
        <LinearGradient colors={[colors.headerTop, colors.bgTop]} style={[styles.container, { paddingTop: insets.top + 12 }]}>
            <Image source={logo} style={styles.logo} accessibilityRole="header" accessibilityLabel="Praiômetro" />
        </LinearGradient>
    );
}
