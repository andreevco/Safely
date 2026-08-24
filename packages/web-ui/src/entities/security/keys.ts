import { defineQueryKeys, finalKey } from '@safely/ux';

export const lockoutKeys = defineQueryKeys('passcode_lockout', {
    state: finalKey
});
