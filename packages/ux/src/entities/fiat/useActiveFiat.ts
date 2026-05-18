import { useMemo } from 'react';

import { FiatAsset } from '@safely/core';

import { useAvailableFiats } from '../../shared';
import { useAccountStore, useAccountSyncStorageUpdate } from '../account';
import { useMutation } from '../query-core';

const USD_FIAT = FiatAsset.create({ symbol: 'USD', name: 'US Dollar' });

export function useActiveFiat(): FiatAsset {
    const stored = useAccountStore(s => s.active?.preferredFiat ?? null);
    const availableFiats = useAvailableFiats();

    return useMemo(() => {
        if (stored && availableFiats.some(fiat => fiat.id.isEq(stored.id))) {
            return stored;
        }
        return USD_FIAT;
    }, [stored, availableFiats]);
}

export function useSetActiveFiat() {
    const update = useAccountSyncStorageUpdate('preferredFiat');

    return useMutation<void, Error, { fiat: FiatAsset }>({
        mutationFn: ({ fiat }) =>
            update((_, storeDraft) => {
                storeDraft.set('preferredFiat', fiat.toJSON());
            })
    });
}
