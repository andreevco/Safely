import { useMemo } from 'react';

import { FiatAsset } from '@safely/core';

import { useAvailableFiats } from '../../shared';
import { useActiveAccountSyncStorageUpdate, useActiveAccountStoreSlot } from '../account';
import { useMutation } from '../query-core';

const USD_FIAT = FiatAsset.create({ symbol: 'USD', name: 'US Dollar' });

export function useActiveFiat(): FiatAsset {
    const stored = useActiveAccountStoreSlot('preferredFiat');
    const availableFiats = useAvailableFiats();

    return useMemo(() => {
        if (stored && availableFiats.some(fiat => fiat.id.isEq(stored.id))) {
            return stored;
        }
        return USD_FIAT;
    }, [stored, availableFiats]);
}

export function useSetActiveFiat() {
    const update = useActiveAccountSyncStorageUpdate('preferredFiat');

    return useMutation<void, Error, { fiat: FiatAsset }>({
        mutationFn: ({ fiat }) =>
            update((_, storeDraft) => {
                storeDraft.set('preferredFiat', fiat.toJSON());
            })
    });
}
