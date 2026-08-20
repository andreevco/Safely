import type { Build } from '@safely/core';

import { createEnumerableStorage, synchronousStorage } from './storage';
import type { DesktopPlatform } from './types';
import { unsupportedSecurityGate } from './unsupported';
import type { DesktopBridge } from '../../shared/bridge';

export type { DesktopPlatform, DesktopPlatformStorage, DesktopSecurityGate } from './types';

const REPORTED_BUILD: Build = 'macos';

function getBridge(): DesktopBridge {
    const bridge = window.safelyDesktop;

    if (!bridge) {
        throw new Error('The preload bridge is missing — the renderer cannot reach the platform');
    }

    return bridge;
}

const bridge = getBridge();

export const platform: DesktopPlatform = {
    appInfo: { ...bridge.appInfo, build: REPORTED_BUILD },
    storage: {
        REGULAR_DESKTOP_STORAGE_ONLY_APP_LEVEL_USE: createEnumerableStorage(bridge.store),
        ENCRYPTED_DESKTOP_STORAGE_ONLY_APP_LEVEL_USE: createEnumerableStorage(
            bridge.encryptedStore
        ),
        SECURE_ENCRYPTED_DESKTOP_STORAGE_ONLY_APP_LEVEL_USE: createEnumerableStorage(
            bridge.secureEncryptedStore
        ),
        synchronous: synchronousStorage
    },
    security: unsupportedSecurityGate,
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
