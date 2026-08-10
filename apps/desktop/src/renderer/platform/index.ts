import type { Build } from '@safely/core';
import type { WebPlatform } from '@safely/web-ui';

import { createEnumerableStorage, synchronousStorage } from './storage';
import type { DesktopBridge } from '../../shared/bridge';
import type { AppInfo } from '../../shared/ipc';

/* TODO(build): the config API only knows `ios` and `android`, so desktop reports itself as iOS
   until the backend accepts a desktop platform — feature flags arrive as the iOS ones. */
const REPORTED_BUILD: Build = 'ios';

export function getBridge(): DesktopBridge {
    const bridge = window.safelyDesktop;

    if (!bridge) {
        throw new Error('The preload bridge is missing — the renderer cannot reach the platform');
    }

    return bridge;
}

export function createDesktopPlatform(options: {
    bridge: DesktopBridge;
    appInfo: AppInfo;
    isUserPresenceAvailable: boolean;
}): WebPlatform {
    const { bridge, appInfo, isUserPresenceAvailable } = options;

    return {
        target: 'desktop',
        appInfo: {
            version: appInfo.version,
            build: REPORTED_BUILD,
            environment: appInfo.environment,
            deviceName: appInfo.deviceName,
            osVersion: appInfo.osVersion,
            locale: appInfo.locale,
            deviceCountryCode: appInfo.deviceCountryCode
        },
        storage: {
            regular: createEnumerableStorage(bridge, 'regular'),
            encrypted: createEnumerableStorage(bridge, 'encrypted'),
            createSecureEncrypted: () => createEnumerableStorage(bridge, 'secureEncrypted'),
            synchronous: synchronousStorage
        },
        security: {
            isAvailable: isUserPresenceAvailable,
            check: options_ => bridge.security.check(options_)
        },
        openExternalUrl: url => bridge.openExternalUrl(url),
        reloadApp: () => bridge.relaunch(),
        clearAllData: async () => {
            await bridge.clearAllData();
            synchronousStorage.clear();
        },
        subscribeAppStateChange: callback => {
            /* the window is on screen when the renderer starts */
            callback('active');

            return bridge.onAppStateChange(callback);
        }
    };
}
