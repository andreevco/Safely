import type { Build } from '@safely/core';

import { createEnumerableStorage, synchronousStorage } from './storage';
import type { DesktopPlatform } from './types';
import { unsupportedSecureEncryptedStorage, unsupportedSecurityGate } from './unsupported';
import type { DesktopBridge } from '../../shared/bridge';
import type { AppInfo } from '../../shared/ipc';

export type { DesktopPlatform, DesktopPlatformStorage, DesktopSecurityGate } from './types';

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
}): DesktopPlatform {
    const { bridge, appInfo } = options;

    return {
        appInfo: { ...appInfo, build: REPORTED_BUILD },
        storage: {
            regular: createEnumerableStorage(bridge.store),
            encrypted: createEnumerableStorage(bridge.encryptedStore),
            /* TODO(vault): both are stubs until `doc/vault.md` is implemented. Nothing on this
               platform can hold key material, and every attempt rejects instead of falling back to
               the `encrypted` scope, which is not a boundary against same-user malware. */
            createSecureEncrypted: () => unsupportedSecureEncryptedStorage,
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
}
