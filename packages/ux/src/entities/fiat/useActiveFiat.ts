import { useMutation, useQueryClient } from '@tanstack/react-query';

import { FiatAsset } from '@safely/core';

import { fiatKeys } from './keys';
import { useBootConfig, useSuspenseQuery } from '../../shared';
import { useActiveAccountSyncedStorage } from '../../shared/storage/account/synced';

const USD_FIAT = FiatAsset.create({ symbol: 'USD', name: 'US Dollar' });

export function useActiveFiatQuery() {
    const { get } = useActiveAccountSyncedStorage('preferredFiat');
    const { currencies } = useBootConfig();

    return useSuspenseQuery<FiatAsset>({
        queryKey: fiatKeys.active().toKey(),
        queryFn: async () => {
            const stored = await get();

            if (stored) {
                const isSupported = currencies.supported_currencies.some(
                    c => c.slug === stored.id.symbol
                );

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
                queryKey: fiatKeys.active().toKey()
            });
        }
    });
}
