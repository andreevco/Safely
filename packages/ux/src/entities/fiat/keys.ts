import { defineQueryKeys, finalKey } from '../../shared';

export const fiatKeys = defineQueryKeys('fiat', {
    active: () => finalKey,
    available: () => finalKey
});
