import { defineQueryKeys, finalKey } from '../../shared';

export const assetKeys = defineQueryKeys('assets', {
    all: (_walletId: string | undefined) => ({
        fiat: (_fiatId: string) => finalKey
    }),
    rate: (_assetId: string) => ({
        fiat: (_fiatId: string) => finalKey
    }),
    chart: (_assetId: string) => ({
        fiat: (_fiatId: string) => ({
            startDate: (_startDate: string) => finalKey
        })
    })
});
