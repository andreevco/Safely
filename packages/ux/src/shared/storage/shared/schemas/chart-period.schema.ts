import z from 'zod';

export const sChartPeriod = z.union([
    z.null(),
    z.enum(['1h', '24h', '7d', '30d', '90d', '12m', 'all'])
]);
