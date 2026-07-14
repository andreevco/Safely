import z from 'zod';

export const sSyncOnboardingCompleted = z.union([z.null(), z.boolean()]);
