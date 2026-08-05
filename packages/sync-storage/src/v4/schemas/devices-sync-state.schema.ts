import z from 'zod';

export const sDeviceSyncState = z.object({
    lastSyncAt: z.number(),
    portfolioIds: z.record(z.string(), z.literal(true))
});

export type SDeviceSyncState = z.infer<typeof sDeviceSyncState>;

export const sDevicesSyncState = z.record(z.string(), sDeviceSyncState);
export type SDevicesSyncState = z.infer<typeof sDevicesSyncState>;
