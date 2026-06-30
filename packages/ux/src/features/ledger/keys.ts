import { defineQueryKeys, finalKey } from '../../shared';

export const ledgerKeys = defineQueryKeys('ledger', {
    accounts: (_deviceId: string | undefined) => finalKey
});
