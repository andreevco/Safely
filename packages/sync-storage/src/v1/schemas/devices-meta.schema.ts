import z from 'zod';

const sDeviceMeta = z.object({
    name: z.string(),
    platform: z.enum(['ios', 'android']),
    osVersion: z.string(),
    appVersion: z.string(),
    pairedAt: z.number()
});

export type SDeviceMeta = z.infer<typeof sDeviceMeta>;

export const sDevicesMeta = z.record(z.string(), sDeviceMeta).nullable();
export type SDevicesMeta = z.infer<typeof sDevicesMeta>;
