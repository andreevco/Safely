import { defineQueryKeys, finalKey } from '../../../shared';

export const sendFormKeys = defineQueryKeys('sendForm', {
    draft: (_walletId: string) => finalKey
});
