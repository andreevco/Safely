import { useMutation, useQueryClient } from '@tanstack/react-query';

import { FiatAsset } from '@safely/core';

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
        mutationFn: async ({ fiat }) => {
            // TODO: Waiting for sync - persist to storage
            client.setQueryData(fiatKeys.active().toKey(), fiat);
        }
    });
}
