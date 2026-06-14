import { defineQueryKeys, finalKey } from '@safely/ux';

export const ledgerKeys = defineQueryKeys('ledger', {
    accounts: (_deviceId: string | undefined) => finalKey
});
