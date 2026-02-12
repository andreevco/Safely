import type { StaticParamList } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import type { RootStack } from './index';
import type { AddWalletStack } from './stacks/AddWalletStack';
import type { SendStack } from './stacks/SendStack';
import type { SettingsStack } from './stacks/SettingsStack';
import type { TabsNavigator } from './tabs';

export type RootStackParamList = StaticParamList<typeof RootStack>;
export type TabsParamList = StaticParamList<typeof TabsNavigator>;
export type SettingsStackParamList = StaticParamList<typeof SettingsStack>;
export type AddWalletStackParamList = StaticParamList<typeof AddWalletStack>;
export type SendStackParamList = StaticParamList<typeof SendStack>;

export type TabsNavigationProp<T extends keyof TabsParamList = keyof TabsParamList> =
    NativeStackNavigationProp<TabsParamList, T>;

export type RootStackNavigationProp<T extends keyof RootStackParamList = keyof RootStackParamList> =
    NativeStackNavigationProp<RootStackParamList, T>;

export type SettingsStackNavigationProp<
    T extends keyof SettingsStackParamList = keyof SettingsStackParamList
> = NativeStackNavigationProp<SettingsStackParamList, T>;

export type AddWalletStackNavigationProp<
    T extends keyof AddWalletStackParamList = keyof AddWalletStackParamList
> = NativeStackNavigationProp<AddWalletStackParamList, T>;

export type SendStackNavigationProp<T extends keyof SendStackParamList = keyof SendStackParamList> =
    NativeStackNavigationProp<SendStackParamList, T>;
