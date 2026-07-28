import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { AmountDisplayOrder, AmountDisplayScope } from './types';
import { defineQueryKeys, useSharedUxStorage } from '../../shared';

const amountDisplayOrderKeys = defineQueryKeys('amountDisplayOrder', {
    scope: (scope: AmountDisplayScope) => [scope]
});

function useAmountDisplayOrder(scope: AmountDisplayScope): AmountDisplayOrder {
    const { get } = useSharedUxStorage(scope);

    const { data } = useQuery({
        queryKey: amountDisplayOrderKeys.scope(scope).toKey(),
        queryFn: async () => (await get()) ?? null,
        staleTime: Infinity
    });

    return data ?? 'fiat';
}

function useSetAmountDisplayOrder(scope: AmountDisplayScope): (order: AmountDisplayOrder) => void {
    const queryClient = useQueryClient();
    const { set } = useSharedUxStorage(scope);

    const { mutate } = useMutation({
        mutationFn: (order: AmountDisplayOrder) => set(order),
        onSuccess: (_result, order) => {
            queryClient.setQueryData(amountDisplayOrderKeys.scope(scope).toKey(), order);
        }
    });

    return mutate;
}

export function useHomeScreenAmountOrder(): AmountDisplayOrder {
    return useAmountDisplayOrder('homeScreenAmountOrder');
}

export function useSetHomeScreenAmountOrder(): (order: AmountDisplayOrder) => void {
    return useSetAmountDisplayOrder('homeScreenAmountOrder');
}

export function useTransactionHistoryAmountOrder(): AmountDisplayOrder {
    return useAmountDisplayOrder('transactionHistoryAmountOrder');
}

export function useSetTransactionHistoryAmountOrder(): (order: AmountDisplayOrder) => void {
    return useSetAmountDisplayOrder('transactionHistoryAmountOrder');
}
