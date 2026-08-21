import type { Build } from '@safely/core';

import { subscribeFullScreen } from './fullScreen';
import { createEnumerableStorage, synchronousStorage } from './storage';
import type { DesktopPlatform } from './types';
import { unsupportedSecurityGate } from './unsupported';
import type { DesktopBridge } from '../../shared/bridge';

export type { DesktopPlatform, DesktopPlatformStorage, DesktopSecurityGate } from './types';
export { subscribeFullScreen, useIsFullScreen } from './fullScreen';

const REPORTED_BUILD: Build = 'macos';

function getBridge(): DesktopBridge {
    const bridge = window.safelyDesktop;

    if (!bridge) {
        throw new Error('The preload bridge is missing — the renderer cannot reach the platform');
    }

    return bridge;
}

const bridge = getBridge();

/* One subscription per renderer, installed where the bridge is created: `useIsFullScreen` is a
   plain read of the store and never owns the wiring. */
subscribeFullScreen(bridge);

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
