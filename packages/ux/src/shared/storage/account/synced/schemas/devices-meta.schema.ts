import z from 'zod';

const sDeviceMeta = z.object({
    name: z.string(),
    platform: z.enum(['ios', 'android']),
    osVersion: z.string(),
    appVersion: z.string(),
    lastSyncedAt: z.number()
});

export type DeviceMeta = z.infer<typeof sDeviceMeta>;

export const sDevicesMeta = z.union([z.record(z.string(), sDeviceMeta), z.null()]);
