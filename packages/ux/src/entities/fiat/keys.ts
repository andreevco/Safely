import { FiatAsset } from '@safely/core';

import { defineQueryKeys, finalKey, mappedParams } from '../../shared/query-core/query-key-factory';

export const fiatKeys = defineQueryKeys('fiat', {
    active: mappedParams(
        (_: { availableFiats: FiatAsset[] }) => finalKey,
        p => [{ availableFiats: p.availableFiats.map(a => a.id.toString()) }]
    ),
    available: () => finalKey
});
