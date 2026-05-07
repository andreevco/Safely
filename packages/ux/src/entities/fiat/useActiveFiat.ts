import { useQueryClient } from '@tanstack/react-query';

import { FiatAsset } from '@safely/core';

import { useAvailableFiats, useSuspenseQuery } from '../../shared';
import { useActiveAccountQueryKey } from '../account';
import { useActiveAccountSyncedStorage } from '../account/storage';
import { useMutation } from '../query-core';

const USD_FIAT = FiatAsset.create({ symbol: 'USD', name: 'US Dollar' });

export function useActiveFiatQuery() {
    const availableFiats = useAvailableFiats();
    const accountQueryKey = useActiveAccountQueryKey();
    const { get } = useActiveAccountSyncedStorage('preferredFiat');

    return useSuspenseQuery<FiatAsset>({
        queryKey: accountQueryKey.preferredFiat.deps({ availableFiats }).toKey(),
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
    const accountQueryKey = useActiveAccountQueryKey();
    const { update } = useActiveAccountSyncedStorage('preferredFiat');

    return useMutation<void, Error, { fiat: FiatAsset }>({
        mutationFn: async ({ fiat }) => {
            await update(draft => {
                (draft as { preferredFiat: unknown }).preferredFiat = fiat.toJSON();
            });
            await client.invalidateQueries({
                queryKey: accountQueryKey.preferredFiat.toKey()
            });
        }
    });
}
