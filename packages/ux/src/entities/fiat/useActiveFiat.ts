import { useQuery, useQueryClient } from '@tanstack/react-query';

import { FiatAsset } from '@safely/core';

import { useAvailableFiats } from '../../shared';
import { useActiveAccountQueryKey } from '../account';
import { useActiveAccountSyncedStorage } from '../account/storage';
import { useMutation } from '../query-core';

const USD_FIAT = FiatAsset.create({ symbol: 'USD', name: 'US Dollar' });

export function useActiveFiatQuery() {
    const availableFiats = useAvailableFiats();
    const accountQueryKey = useActiveAccountQueryKey();
    const { get } = useActiveAccountSyncedStorage('preferredFiat');

    const resolve = (): FiatAsset => {
        const stored = get();

        if (stored && availableFiats.some(fiat => fiat.id.isEq(stored.id))) {
            return stored;
        }

        return USD_FIAT;
    };

    return useQuery({
        queryKey: accountQueryKey.preferredFiat.deps({ availableFiats }).toKey(),
        queryFn: resolve,
        initialData: resolve,
        staleTime: Infinity
    });
}

export function useActiveFiat() {
    return useActiveFiatQuery().data;
}

export function useSetActiveFiat() {
    const client = useQueryClient();
    const accountQueryKey = useActiveAccountQueryKey();
    const { set } = useActiveAccountSyncedStorage('preferredFiat');

    return useMutation<void, Error, { fiat: FiatAsset }>({
        mutationFn: async ({ fiat }) => {
            await set(fiat.toJSON());
            await client.invalidateQueries({
                queryKey: accountQueryKey.preferredFiat.toKey()
            });
        }
    });
}
