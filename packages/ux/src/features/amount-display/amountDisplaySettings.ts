import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback } from 'react';

import type { AmountUnit } from './types';
import type { AmountDisplay } from '../../shared';
import { defineQueryKeys, finalKey, sAmountDisplay, useSharedUxStorage } from '../../shared';

const amountDisplayKeys = defineQueryKeys('amountDisplay', {
    settings: finalKey
});

const defaultAmountDisplay = sAmountDisplay.parse(null);

function useAmountDisplay<T>(select: (settings: AmountDisplay) => T): T {
    const { get } = useSharedUxStorage('amountDisplay');

    const { data } = useQuery({
        queryKey: amountDisplayKeys.settings.toKey(),
        queryFn: get,
        staleTime: Infinity,
        select
    });

    return data ?? select(defaultAmountDisplay);
}

function useSetAmountDisplay(): (patch: Partial<AmountDisplay>) => void {
    const queryClient = useQueryClient();
    const { get, set } = useSharedUxStorage('amountDisplay');

    const { mutate } = useMutation({
        mutationFn: async (patch: Partial<AmountDisplay>) => {
            const settings = { ...(await get()), ...patch };
            await set(settings);

            return settings;
        },
        onSuccess: settings => {
            queryClient.setQueryData(amountDisplayKeys.settings.toKey(), settings);
        }
    });

    return mutate;
}

export function useMainBalanceUnit(): AmountUnit {
    return useAmountDisplay(settings => settings.mainBalanceUnit);
}

export function useSetMainBalanceUnit(): (unit: AmountUnit) => void {
    const setAmountDisplay = useSetAmountDisplay();

    return useCallback(
        (unit: AmountUnit) => setAmountDisplay({ mainBalanceUnit: unit }),
        [setAmountDisplay]
    );
}

export function useHomeScreenAmountOrder(): AmountUnit {
    return useAmountDisplay(settings => settings.homeScreenOrder);
}

export function useSetHomeScreenAmountOrder(): (order: AmountUnit) => void {
    const setAmountDisplay = useSetAmountDisplay();

    return useCallback(
        (order: AmountUnit) => setAmountDisplay({ homeScreenOrder: order }),
        [setAmountDisplay]
    );
}

export function useTransactionHistoryAmountOrder(): AmountUnit {
    return useAmountDisplay(settings => settings.transactionHistoryOrder);
}

export function useSetTransactionHistoryAmountOrder(): (order: AmountUnit) => void {
    const setAmountDisplay = useSetAmountDisplay();

    return useCallback(
        (order: AmountUnit) => setAmountDisplay({ transactionHistoryOrder: order }),
        [setAmountDisplay]
    );
}

export function useShowFullSentAmount(): boolean {
    return useAmountDisplay(settings => settings.showFullSentAmount);
}

export function useSetShowFullSentAmount(): (isEnabled: boolean) => void {
    const setAmountDisplay = useSetAmountDisplay();

    return useCallback(
        (isEnabled: boolean) => setAmountDisplay({ showFullSentAmount: isEnabled }),
        [setAmountDisplay]
    );
}
