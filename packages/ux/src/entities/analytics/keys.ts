import { defineQueryKeys, finalKey } from '../../shared';

export const analyticsKeys = defineQueryKeys('analytics', {
    accountUuid: (_accountId: string) => finalKey
});
