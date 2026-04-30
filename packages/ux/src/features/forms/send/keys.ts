import { defineQueryKeys, finalKey } from '../../../shared/query-core/query-key-factory';

export const sendFormKeys = defineQueryKeys('sendForm', {
    draft: (_walletId: string) => finalKey
});
