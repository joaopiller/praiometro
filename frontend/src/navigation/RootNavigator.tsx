import { MaterialCommunityIcons } from '@expo/vector-icons';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { DefaultTheme, NavigationContainer, type Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CustomHeader from '../components/CustomHeader';
import Clima from '../screens/Clima';
import Home from '../screens/Home';
import Praia from '../screens/Praia';
import Praias from '../screens/Praias';
import SobreNos from '../screens/SobreNos';
import { colors } from '../theme';
import type { PraiasStackParamList, TabParamList } from './types';

const Tab = createBottomTabNavigator<TabParamList>();
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

export default function RootNavigator() {
    const insets = useSafeAreaInsets();
    return (
        <NavigationContainer theme={tema}>
            <Tab.Navigator
                screenOptions={{
                    header: () => <CustomHeader />,
                    tabBarStyle: {
                        backgroundColor: colors.tabBar,
                        borderTopColor: colors.border,
                        height: 64 + insets.bottom,
                        paddingTop: 8,
                    },
                    tabBarActiveTintColor: colors.sand,
                    tabBarInactiveTintColor: 'rgba(255,255,255,0.6)',
                    tabBarLabelStyle: { fontSize: 11, fontWeight: '600' },
                }}
            >
                <Tab.Screen
                    name="Home"
                    component={Home}
                    options={{
                        title: 'Mapa',
                        headerShown: false,
                        tabBarIcon: ({ color, focused }) => (
                            <MaterialCommunityIcons name={focused ? 'map-marker-radius' : 'map-marker-radius-outline'} size={26} color={color} />
                        ),
                    }}
                />
                <Tab.Screen
                    name="PraiasTab"
                    component={PraiasStackScreen}
                    options={{
                        title: 'Praias',
                        tabBarIcon: ({ color, focused }) => (
                            <MaterialCommunityIcons name={focused ? 'umbrella-beach' : 'umbrella-beach-outline'} size={26} color={color} />
                        ),
                    }}
                    listeners={({ navigation }) => ({
                        // Tocar na aba sempre volta para a lista de praias
                        tabPress: (e) => {
                            e.preventDefault();
                            navigation.navigate('PraiasTab', { screen: 'Praias' });
                        },
                    })}
                />
                <Tab.Screen
                    name="Clima"
                    component={Clima}
                    options={{
                        title: 'Clima',
                        tabBarIcon: ({ color }) => <MaterialCommunityIcons name="weather-partly-cloudy" size={26} color={color} />,
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
        </NavigationContainer>
    );
}
