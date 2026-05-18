import { useMemo } from 'react';

import { FiatAsset } from '@safely/core';

import { useAvailableFiats } from '../../shared';
import { useActiveAccount, useAccountStore } from '../account';
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
    const account = useActiveAccount();

    return useMutation<void, Error, { fiat: FiatAsset }>({
        mutationFn: async ({ fiat }) => {
            await account.syncProvider.set('preferredFiat', fiat.toJSON());
        }
    });
}
