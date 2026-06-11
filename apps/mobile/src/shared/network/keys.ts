import { defineQueryKeys, finalKey } from '@safely/ux';

export const networkKeys = defineQueryKeys('network', {
    isOffline: finalKey
});
