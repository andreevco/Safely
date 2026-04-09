import * as Device from 'expo-device';
import { Platform } from 'react-native';

import { Build } from '@safely/core';

import { createMobileLogger } from './logger';
import packageJson from '../../../package.json';

const build: Build =
    Platform.select({
        ios: 'ios' as const,
        android: 'android' as const,
        web: 'web' as const
    }) ?? ('web' as const);

const deviceInfo = {
    name: Device.modelName ?? (Platform.OS === 'ios' ? 'iPhone' : 'Android device'),
    osVersion: Device.osVersion ?? String(Platform.Version)
};

const { logger, shareLogs } = createMobileLogger({
    appVersion: packageJson.version,
    build,
    deviceInfo,
    isDev: __DEV__
});

const prevHandler = ErrorUtils.getGlobalHandler();
ErrorUtils.setGlobalHandler((error, isFatal) => {
    logger.error(`[Unhandled${isFatal ? ' FATAL' : ''}]`, error);
    prevHandler(error, isFatal);
});

if (typeof globalThis.onunhandledrejection === 'undefined') {
    globalThis.onunhandledrejection = (event: PromiseRejectionEvent) => {
        logger.error('[Unhandled Promise Rejection]', event.reason);
    };
}

export { logger, shareLogs, build, deviceInfo };
