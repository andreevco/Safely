import z from 'zod';

export const sDismissedProviders = z.union([z.null(), z.array(z.string())]);
