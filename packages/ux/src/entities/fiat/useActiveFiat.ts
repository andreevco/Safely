import { useMutation, useQueryClient } from '@tanstack/react-query';

import { FiatAsset } from '@safely/core';

import { fiatKeys } from './keys';
import { useAvailableFiats, useSuspenseQuery, useActiveAccountSyncedStorage } from '../../shared';

const USD_FIAT = FiatAsset.create({ symbol: 'USD', name: 'US Dollar' });

export function useActiveFiatQuery() {
    const availableFiats = useAvailableFiats();
    const { get } = useActiveAccountSyncedStorage('preferredFiat');

    return useSuspenseQuery<FiatAsset>({
        queryKey: fiatKeys.active({ availableFiats }).toKey(),
        queryFn: async () => {
            const stored = get();

            if (stored) {
                const isSupported = availableFiats.some(fiat => fiat.id.isEq(stored.id));

                if (isSupported) return stored;
            }

            return USD_FIAT;
        },
        staleTime: Infinity
    });
}

export function useActiveFiat() {
    return useActiveFiatQuery().data;
}

export function useSetActiveFiat() {
    const client = useQueryClient();
    const { set } = useActiveAccountSyncedStorage('preferredFiat');

    return useMutation<void, Error, { fiat: FiatAsset }>({
        mutationFn: async ({ fiat }) => {
            await set(fiat.toJSON());
            await client.invalidateQueries({
                queryKey: fiatKeys.active.toKey()
            });
        }
    });
}
