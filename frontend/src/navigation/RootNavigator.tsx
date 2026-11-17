import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeBottomTabNavigator } from '@react-navigation/bottom-tabs/unstable';
import { DefaultTheme, NavigationContainer, type Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import type { ComponentType } from 'react';
import { Platform, View } from 'react-native';
import CustomHeader from '../components/CustomHeader';
import Clima from '../screens/Clima';
import Home from '../screens/Home';
import Praia from '../screens/Praia';
import Praias from '../screens/Praias';
import SobreNos from '../screens/SobreNos';
import { colors } from '../theme';
import BarraDeAbas from './BarraDeAbas';
import type { PraiasStackParamList, TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();
const AbaNativa = createNativeBottomTabNavigator<TabParamList>();
const PraiasStack = createNativeStackNavigator<PraiasStackParamList>();

const tema: Theme = {
    ...DefaultTheme,
    colors: { ...DefaultTheme.colors, background: colors.bgBottom, card: colors.brand, text: colors.text, primary: colors.sand },
};

function PraiasStackScreen() {
    return (
        <PraiasStack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
            <PraiasStack.Screen name="Praias" component={Praias} />
            <PraiasStack.Screen name="Praia" component={Praia} />
        </PraiasStack.Navigator>
    );
}

// a barra nativa não desenha cabeçalho: a própria tela coloca o do app no topo
function comCabecalho(Tela: ComponentType) {
    return function TelaComCabecalho() {
        return (
            <View style={{ flex: 1, backgroundColor: colors.bgBottom }}>
                <CustomHeader />
                <Tela />
            </View>
        );
    };
}

const PraiasComCabecalho = comCabecalho(PraiasStackScreen);
const ClimaComCabecalho = comCabecalho(Clima);
const SobreComCabecalho = comCabecalho(SobreNos);

/** iOS: barra de abas do sistema (UITabBarController), com Liquid Glass a partir do iOS 26 */
function AbasIOS() {
    return (
        <AbaNativa.Navigator screenOptions={{ tabBarActiveTintColor: colors.brand }}>
            <AbaNativa.Screen
                name="Home"
                component={Home}
                options={{
                    title: 'Mapa',
                    tabBarIcon: ({ focused }) => ({ type: 'sfSymbol', name: focused ? 'map.fill' : 'map' }),
                }}
            />
            <AbaNativa.Screen
                name="PraiasTab"
                component={PraiasComCabecalho}
                options={{
                    title: 'Praias',
                    tabBarIcon: ({ focused }) => ({ type: 'sfSymbol', name: focused ? 'beach.umbrella.fill' : 'beach.umbrella' }),
                }}
            />
            <AbaNativa.Screen
                name="Clima"
                component={ClimaComCabecalho}
                options={{
                    title: 'Clima',
                    tabBarIcon: ({ focused }) => ({ type: 'sfSymbol', name: focused ? 'cloud.sun.fill' : 'cloud.sun' }),
                }}
            />
            <AbaNativa.Screen
                name="SobreNos"
                component={SobreComCabecalho}
                options={{
                    title: 'Sobre',
                    tabBarIcon: ({ focused }) => ({ type: 'sfSymbol', name: focused ? 'info.circle.fill' : 'info.circle' }),
                }}
            />
        </AbaNativa.Navigator>
    );
}

/** Android: barra flutuante desenhada à mão, com a mesma cara da do iPhone */
function AbasAndroid() {
    return (
        <Tab.Navigator tabBar={(props) => <BarraDeAbas {...props} />} screenOptions={{ header: () => <CustomHeader /> }}>
            <Tab.Screen
                name="Home"
                component={Home}
                options={{
                    title: 'Mapa',
                    headerShown: false,
                    tabBarIcon: ({ color, focused }) => (
                        <MaterialCommunityIcons name={focused ? 'map' : 'map-outline'} size={25} color={color} />
                    ),
                }}
            />
            <Tab.Screen
                name="PraiasTab"
                component={PraiasStackScreen}
                options={{
                    title: 'Praias',
                    tabBarIcon: ({ color, focused }) => (
                        <MaterialCommunityIcons name={focused ? 'umbrella-beach' : 'umbrella-beach-outline'} size={25} color={color} />
                    ),
                }}
                listeners={({ navigation }) => ({
                    // Tocar na aba sempre volta para a lista de praias
                    tabPress: (e) => {
                        e.preventDefault();
                        navigation.navigate('PraiasTab', { screen: 'Praias', pop: true });
                    },
                })}
            />
            <Tab.Screen
                name="Clima"
                component={Clima}
                options={{
                    title: 'Clima',
                    tabBarIcon: ({ color }) => <MaterialCommunityIcons name="weather-partly-cloudy" size={25} color={color} />,
                }}
            />
            <Tab.Screen
                name="SobreNos"
                component={SobreNos}
                options={{
                    title: 'Sobre',
                    tabBarIcon: ({ color, focused }) => (
                        <MaterialCommunityIcons name={focused ? 'information' : 'information-outline'} size={25} color={color} />
                    ),
                }}
            />
        </Tab.Navigator>
    );
}

export default function RootNavigator() {
    return <NavigationContainer theme={tema}>{Platform.OS === 'ios' ? <AbasIOS /> : <AbasAndroid />}</NavigationContainer>;
}
