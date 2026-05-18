import * as Device from 'expo-device';
import { Platform } from 'react-native';

import { Build } from '@safely/core';

export const build: Build =
    Platform.select({
        ios: 'ios' as const,
        android: 'android' as const,
        web: 'web' as const
    }) ?? ('web' as const);

export const deviceInfo = {
    name: Device.modelName ?? (Platform.OS === 'ios' ? 'iPhone' : 'Android device'),
    osVersion: Device.osVersion ?? String(Platform.Version)
};

export const environment: 'production' | 'development' = __DEV__ ? 'development' : 'production';
