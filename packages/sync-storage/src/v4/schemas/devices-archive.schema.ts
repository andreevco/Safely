import z from 'zod';

export const sDeviceArchive = z.object({
    archivedAt: z.number(),
    archivedFromIkPubHex: z.string().nullable()
});

export type SDeviceArchive = z.infer<typeof sDeviceArchive>;

export const sDevicesArchive = z.record(z.string(), sDeviceArchive);
export type SDevicesArchive = z.infer<typeof sDevicesArchive>;
