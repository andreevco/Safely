import { defineQueryKeys, finalKey } from '@safely/ux';

export const passcodeKeys = defineQueryKeys('passcode', {
    state: finalKey
});
