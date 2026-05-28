import type { NavigationProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

export type RootStackParamList = ReactNavigation.RootParamList;

export type RootStackNavigationProp<T extends keyof RootStackParamList = keyof RootStackParamList> =
    NativeStackNavigationProp<RootStackParamList, T>;

export type RootStackNavigation = NavigationProp<RootStackParamList>;

export type SettingsStackNavigationProp<
    T extends keyof MobileNavigation.Settings = keyof MobileNavigation.Settings
> = NativeStackNavigationProp<MobileNavigation.Settings, T>;

export type AddWalletStackNavigationProp<
    T extends keyof MobileNavigation.AddWallet = keyof MobileNavigation.AddWallet
> = NativeStackNavigationProp<MobileNavigation.AddWallet, T>;

export type SendStackNavigationProp<
    T extends keyof MobileNavigation.Send = keyof MobileNavigation.Send
> = NativeStackNavigationProp<MobileNavigation.Send, T>;

export type TabsNavigationProp<
    T extends keyof MobileNavigation.Tabs = keyof MobileNavigation.Tabs
> = NativeStackNavigationProp<MobileNavigation.Tabs, T>;
