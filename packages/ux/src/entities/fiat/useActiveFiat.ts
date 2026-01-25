import { useMutation, useQueryClient } from '@tanstack/react-query';

import { FiatAsset } from '@safely/core/entities';

import { fiatKeys } from './keys';
import { useSuspenseQuery } from '../../shared';

const USD_FIAT = FiatAsset.create({ symbol: 'USD', name: 'US Dollar' });

export function useActiveFiatQuery() {
    return useSuspenseQuery<FiatAsset>({
        queryKey: fiatKeys.active().toKey(),
        queryFn: async () => {
            // TODO: Waiting for sync
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

    return useMutation<void, Error, { fiat: FiatAsset }>({
        async mutationFn() {
            // TODO: Waiting for sync
            await client.invalidateQueries({
                queryKey: fiatKeys.active().toKey()
            });
        }
    });
}
