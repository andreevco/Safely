import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { CryptoAssetAmount } from '@safely/core';

import { defineQueryKeys, finalKey, useSharedUxStorage } from '../../shared';

const showFullSentAmountKeys = defineQueryKeys('showFullSentAmount', {
    remembered: finalKey
});

export function useShowFullSentAmount(): boolean {
    const { get } = useSharedUxStorage('showFullSentAmount');

    const { data } = useQuery({
        queryKey: showFullSentAmountKeys.remembered.toKey(),
        queryFn: async () => (await get()) ?? null,
        staleTime: Infinity
    });

    return data ?? false;
}

export function useSetShowFullSentAmount(): (isEnabled: boolean) => void {
    const queryClient = useQueryClient();
    const { set } = useSharedUxStorage('showFullSentAmount');

    const { mutate } = useMutation({
        mutationFn: (isEnabled: boolean) => set(isEnabled),
        onSuccess: (_result, isEnabled) => {
            queryClient.setQueryData(showFullSentAmountKeys.remembered.toKey(), isEnabled);
        }
    });

    return mutate;
}

type SentAmountParams = {
    isInitiator: boolean;
    value: CryptoAssetAmount;
    fee: CryptoAssetAmount | undefined;
    showFullSentAmount: boolean;
};

export type DisplayedCryptoAmount = {
    amount: CryptoAssetAmount;
    isFullPrecision: boolean;
};

export function resolveSentAmount(params: SentAmountParams): DisplayedCryptoAmount {
    const { isInitiator, value, fee, showFullSentAmount } = params;

    if (!isInitiator || !showFullSentAmount) {
        return { amount: value, isFullPrecision: false };
    }

    return { amount: fee ? value.add(fee) : value, isFullPrecision: true };
}
