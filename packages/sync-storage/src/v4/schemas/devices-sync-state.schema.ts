import z from 'zod';

export const sDeviceSyncState = z.object({
    lastSyncAt: z.number(),
    portfolioIds: z.array(z.string())
});

export type SDeviceSyncState = z.infer<typeof sDeviceSyncState>;

export const sDevicesSyncState = z.record(z.string(), sDeviceSyncState);
export type SDevicesSyncState = z.infer<typeof sDevicesSyncState>;
