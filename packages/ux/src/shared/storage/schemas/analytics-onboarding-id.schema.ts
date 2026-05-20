import z from 'zod';

export const sAnalyticsOnboardingId = z.union([z.null(), z.string()]);
