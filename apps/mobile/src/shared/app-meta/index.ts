import * as Device from 'expo-device';
import * as Localization from 'expo-localization';
import { Platform } from 'react-native';

import type { Build } from '@safely/core';

export const build: Build =
    Platform.select({
        ios: 'ios' as const,
        android: 'android' as const
    }) ?? ('ios' as const);

const isIOSAppOnMac = Platform.OS === 'ios' && Device.deviceType === Device.DeviceType.DESKTOP;

const fallbackName = Platform.OS === 'ios' ? 'iPhone' : 'Android device';

export const deviceInfo = {
    name: isIOSAppOnMac ? 'Apple Silicon Mac (iOS App)' : (Device.modelName ?? fallbackName),
    osVersion: Device.osVersion ?? String(Platform.Version),
    // TODO: it's null for Web. It's not actual case for now, but we want to use RN for web as well
    countryCode: Localization.getLocales()[0].regionCode!
};

export const environment: 'production' | 'development' = __DEV__ ? 'development' : 'production';
