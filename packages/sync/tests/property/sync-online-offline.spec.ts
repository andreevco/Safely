import fc from 'fast-check';
import { describe, it } from 'vitest';

import type { Op } from './ops';
import { applyOps, makeInitialDevices, opsArb } from './ops';

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
    // This test is super heavy for CI
    // To run it - increase numRuns to 10000
    it('applies random online/offline operations and keeps online devices converged', async () => {
        await fc.assert(
            fc.asyncProperty(opsArb, async ops => {
                await expectOpsToKeepOnlineDevicesConverged(ops);
            }),
            {
                numRuns: 1
            }
        );
    }, 3000000);

    it('does not return an offline device before the only online device has pushed device revocation', async () => {
        const ops: Op[] = [
            { type: 'device.takeOnlineOffline', targetIndex: 1 },
            { type: 'device.addOnlineFromOnline', actorIndex: 0 },
            { type: 'device.removeOnlineFromOnline', actorIndex: 1, targetIndex: 0 },
            { type: 'device.returnOfflineOnline', targetIndex: 0 }
        ];

        await expectOpsToKeepOnlineDevicesConverged(ops);
    });

    it('self deleted device without issues', async () => {
        const ops: Op[] = [{ type: 'device.deleteLocalOnlineSelf', targetIndex: 0 }];
        await expectOpsToKeepOnlineDevicesConverged(ops);
    });
});
