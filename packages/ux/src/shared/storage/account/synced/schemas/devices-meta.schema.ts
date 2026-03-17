import { sha256 } from '@noble/hashes/sha2.js';
import { bytesToHex } from '@noble/hashes/utils.js';
import z from 'zod';

import { Portfolio } from '@safely/core';

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

export function calculatePortfoliosHashes(
    portfolios: Portfolio[]
): DeviceMeta['syncState']['portfoliosHashes'] {
    return Object.fromEntries(
        portfolios.map(p => [p, bytesToHex(sha256(Buffer.from(JSON.stringify(p), 'utf8')))])
    );
}

export type DeviceMeta = z.infer<typeof sDeviceMeta>;

export const sDevicesMeta = z.union([z.record(z.string(), sDeviceMeta), z.null()]);
