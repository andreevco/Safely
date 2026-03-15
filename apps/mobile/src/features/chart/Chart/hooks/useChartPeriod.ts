import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { defineQueryKeys, finalKey, useSharedStructuredStorage } from '@safely/ux';

import { ChartPeriod } from '../config';

const chartPeriodKeys = defineQueryKeys('chartPeriod', {
    selected: finalKey
});

const DEFAULT_PERIOD = ChartPeriod.ONE_MONTH;

export function useChartPeriodQuery() {
    const { get } = useSharedStructuredStorage('chartPeriod');

    return useQuery({
        queryKey: chartPeriodKeys.selected.toKey(),
        queryFn: async () => {
            const period = await get();
            return (period as ChartPeriod) ?? DEFAULT_PERIOD;
        },
        staleTime: Infinity
    });
}

export function useSetChartPeriod() {
    const queryClient = useQueryClient();
    const { set } = useSharedStructuredStorage('chartPeriod');

    return useMutation({
        mutationFn: async (period: ChartPeriod) => {
            await set(period);
        },
        async onSuccess(_data, period) {
            queryClient.setQueryData(chartPeriodKeys.selected.toKey(), period);
        }
    });
}
