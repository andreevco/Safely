import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { defineQueryKeys, finalKey, useSharedUxStorage } from '../../shared';

export type MainBalanceUnit = 'fiat' | 'crypto';

const mainBalanceUnitKeys = defineQueryKeys('mainBalanceUnit', {
    remembered: finalKey
});

export function useMainBalanceUnit(): MainBalanceUnit {
    const { get } = useSharedUxStorage('mainBalanceUnit');

    const { data } = useQuery({
        queryKey: mainBalanceUnitKeys.remembered.toKey(),
        queryFn: async () => (await get()) ?? null,
        staleTime: Infinity
    });

    return data ?? 'fiat';
}

export function useSetMainBalanceUnit(): (unit: MainBalanceUnit) => void {
    const queryClient = useQueryClient();
    const { set } = useSharedUxStorage('mainBalanceUnit');

    const { mutate } = useMutation({
        mutationFn: (unit: MainBalanceUnit) => set(unit),
        onSuccess: (_result, unit) => {
            queryClient.setQueryData(mainBalanceUnitKeys.remembered.toKey(), unit);
        }
    });

    return mutate;
}
