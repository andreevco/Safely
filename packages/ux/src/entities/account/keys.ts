import { FiatAsset } from '@safely/core';

import { defineQueryKeys, finalKey, mappedParams } from '../../shared';

export const accountKey = defineQueryKeys('account', {
    list: {
        active: finalKey
    },
    accountId: (_id: string | undefined) => {
        return {
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
            },
            devices: {
                meta: finalKey,
                currentIkPub: finalKey
            },
            lastSeedRevealedAt: finalKey
        };
    }
});
