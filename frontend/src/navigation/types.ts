import type { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import type { CompositeScreenProps, NavigatorScreenParams } from '@react-navigation/native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

export type PraiasStackParamList = {
    Praias: undefined;
    Praia: { id: string };
};

export type TabParamList = {
    Home: undefined;
    PraiasTab: NavigatorScreenParams<PraiasStackParamList>;
    Clima: undefined;
    SobreNos: undefined;
};

export type PraiasScreenProps<T extends keyof PraiasStackParamList> = CompositeScreenProps<
    NativeStackScreenProps<PraiasStackParamList, T>,
    BottomTabScreenProps<TabParamList>
>;

export type TabScreenProps<T extends keyof TabParamList> = BottomTabScreenProps<TabParamList, T>;

declare global {
    namespace ReactNavigation {
        // eslint-disable-next-line @typescript-eslint/no-empty-object-type
        interface RootParamList extends TabParamList {}
    }
}
