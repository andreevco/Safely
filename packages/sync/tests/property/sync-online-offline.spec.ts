import fc from 'fast-check';
import { describe, it } from 'vitest';

import type { Op } from './ops';
import { applyOps, makeInitialDevices, opsArb } from './ops';

const divergentDeviceListOps: Op[] = [
    { type: 'device.takeOnlineOffline', targetIndex: 1 },
    { type: 'device.addOnlineFromOnline', actorIndex: 0 },
    { type: 'device.removeOnlineFromOnline', actorIndex: 1, targetIndex: 0 },
    { type: 'device.returnOfflineOnline', targetIndex: 0 }
];

async function expectOpsToKeepOnlineDevicesConverged(ops: Op[]): Promise<void> {
    const devices = await makeInitialDevices();

    try {
        await applyOps(devices, ops);
    } finally {
        for (const device of devices) {
            device.account.syncProvider.dispose();
        }
    }
}

describe('Sync online/offline properties', () => {
    it('reproduces divergent active device lists', async () => {
        await expectOpsToKeepOnlineDevicesConverged(divergentDeviceListOps);
    }, 300000);

    it('applies random online/offline operations and keeps online devices converged', async () => {
        await fc.assert(
            fc.asyncProperty(opsArb, async ops => {
                await expectOpsToKeepOnlineDevicesConverged(ops);
            }),
            {
                numRuns: 1000,

                seed: -735076880,
                path: '6:2:0:1:3:5:1:3:2:6:8:9:9:11:9:9:9:9:9:9:9:9:9:9:9:9:9:9:9:9:9:9:9:9:9:9:9:9:9:9:9:9:9:9:9:9:9:9:9:9:9:9:9:9:9:9:9',
                endOnFailure: true
            }
        );
    }, 300000);
});
