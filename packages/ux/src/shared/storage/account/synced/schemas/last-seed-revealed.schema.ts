import z from 'zod';

const sSeedRevealInfo = z.object({
    timestamp: z.number(),
    deviceName: z.string()
});

export type SeedRevealInfo = z.infer<typeof sSeedRevealInfo>;

export const sLastSeedRevealedAt = z.union([sSeedRevealInfo, z.number(), z.null()]);
