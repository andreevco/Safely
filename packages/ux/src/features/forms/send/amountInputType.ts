import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import type { AmountInputType } from './types';
import { defineQueryKeys, finalKey, useSharedUxStorage } from '../../../shared';

const sendAmountInputTypeKeys = defineQueryKeys('sendAmountInputType', {
    remembered: finalKey
});

export function useAmountInputType(): AmountInputType {
    const { get } = useSharedUxStorage('sendAmountInputType');

    const { data } = useQuery({
        queryKey: sendAmountInputTypeKeys.remembered.toKey(),
        queryFn: async () => (await get()) ?? null,
        staleTime: Infinity
    });

    return data ?? 'crypto';
}

export function useSetAmountInputType(): (type: AmountInputType) => void {
    const queryClient = useQueryClient();
    const { set } = useSharedUxStorage('sendAmountInputType');

    const { mutate } = useMutation({
        mutationFn: (type: AmountInputType) => set(type),
        onSuccess: (_result, type) => {
            queryClient.setQueryData(sendAmountInputTypeKeys.remembered.toKey(), type);
        }
    });

    return mutate;
}
