import { FiatAsset } from '@safely/core';

import { defineQueryKeys, finalKey, mappedParams } from '../../shared';

export const accountStorageKey = defineQueryKeys('account', {
    list: {
        active: finalKey
    },
    accountId: (_id: string | null) => {
        return {
            accountData: finalKey,
            preferredFiat: {
                deps: mappedParams(
                    (_: { availableFiats: FiatAsset[] }) => {
                        return finalKey;
                    },
                    p => {
                        return [{ availableFiats: p.availableFiats.map(a => a.id.toString()) }];
                    }
                )
            },
            portfolios: {
                active: finalKey
            }
        };
    }
});
