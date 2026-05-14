import z from 'zod';

const sDeviceMeta = z.object({
    name: z.string(),
    platform: z.enum(['ios', 'android']),
    osVersion: z.string(),
    appVersion: z.string(),
    pairedAt: z.number(),
    syncState: z.object({
        stateHash: z.string(),
        portfoliosHashes: z.record(z.string(), z.string())
    })
});

export const sDevicesMeta = z.record(z.string(), sDeviceMeta).nullable();
