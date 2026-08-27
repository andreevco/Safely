import type { Build } from '@safely/core';

import { createEnumerableStorage, synchronousStorage } from './storage';
import type { DesktopPlatform } from './types';
import type { DesktopBridge } from '../../shared/bridge';

export type { DesktopPlatform, DesktopPlatformStorage } from './types';

const REPORTED_BUILD: Build = 'macos';

function getBridge(): DesktopBridge {
    const bridge = window.safelyDesktop;

    if (!bridge) {
        throw new Error('The preload bridge is missing — the renderer cannot reach the platform');
    }

    return bridge;
}

const bridge = getBridge();

let isFullScreen = false;
const fullScreenListeners = new Set<() => void>();

function setFullScreen(value: boolean): void {
    if (value === isFullScreen) {
        return;
    }

    isFullScreen = value;
    fullScreenListeners.forEach(notify => notify());
}

void bridge.isFullScreen().then(setFullScreen);
bridge.onFullScreenChange(setFullScreen);

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
    biometry: bridge.biometry,
    camera: bridge.camera,
    openExternalUrl: url => bridge.openExternalUrl(url),
    protectScreen: isProtected => void bridge.setContentProtection(isProtected),
    reloadApp: () => bridge.relaunch(),
    clearAllData: async () => {
        await bridge.clearAllData();
        synchronousStorage.clear();
    },
    subscribeAppStateChange: callback => {
        /* the window is on screen when the renderer starts */
        callback('active');

        return bridge.onAppStateChange(callback);
    },
    subscribeFullScreen: onChange => {
        fullScreenListeners.add(onChange);

        return () => {
            fullScreenListeners.delete(onChange);
        };
    },
    getIsFullScreen: () => isFullScreen
};
