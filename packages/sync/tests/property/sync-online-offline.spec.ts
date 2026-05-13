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
    // To run it - increase numRuns to 10000 and lower waitingForRetry to 1ms and
    // reconnect onboarding timeout to 1ms
    it('applies random online/offline operations and keeps online devices converged', async () => {
        await fc.assert(
            fc.asyncProperty(opsArb, async ops => {
                await expectOpsToKeepOnlineDevicesConverged(ops);
            }),
            {
                numRuns: 0
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

    // TODO: consider removing IK signatures from snapshots
    // I dont really know what to do in this case. To handle this case in the current implementation we need to
    // validate snapshots IK signature using revoked public keys. This removes the necessity of signing snapshots
    // with IK at all.
    // There are a lot of similar edge cases with current implementation of self delete.
    //
    // it('should sync after 2 remote self deletes', async () => {
    //     const ops: Op[] = [                                           // initial: [A, B]
    //         { type: 'device.takeOnlineOffline', targetIndex: 0 },     // A -> offline
    //         { type: 'device.addOnlineFromOnline', actorIndex: 0 },    // B added C
    //         { type: 'device.deleteLocalOnlineSelf', targetIndex: 0 }, // B deleted itself
    //         { type: 'device.deleteLocalOnlineSelf', targetIndex: 0 }, // C deleted itself
    //         { type: 'device.returnOfflineOnline', targetIndex: 0 }    // A went online
    //     ];
    //     await expectOpsToKeepOnlineDevicesConverged(ops);
    // });
});
