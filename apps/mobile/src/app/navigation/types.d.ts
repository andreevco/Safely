import type { StaticParamList } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { RootStack } from './index';
import type { TabsNavigator } from './tabs';

export type RootStackParamList = StaticParamList<typeof RootStack>;
export type TabsParamList = StaticParamList<typeof TabsNavigator>;

export type TabsNavigationProp<T extends keyof TabsParamList = keyof TabsParamList> =
    NativeStackNavigationProp<TabsParamList, T>;

export type RootStackNavigationProp<T extends keyof RootStackParamList = keyof RootStackParamList> =
    NativeStackNavigationProp<RootStackParamList, T>;
