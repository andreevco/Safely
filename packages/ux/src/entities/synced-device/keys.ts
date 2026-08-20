import { defineQueryKeys, finalKey } from '../../shared';

export const syncedDeviceKeys = defineQueryKeys('syncedDevice', {
    hiddenWarnings: finalKey
});
