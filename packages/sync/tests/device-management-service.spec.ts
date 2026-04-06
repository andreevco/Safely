import { beforeEach, describe, expect, it } from 'vitest';

import { MockSnapshotsServer } from './mocks/mock-snapshots-api';
import { createMachineContext, getMasterKey, MachineContext } from './mocks/mock-sync-context';
import { ed25519_keygen } from '../src/crypto/ed25519';

describe('device management service', () => {
    let server: MockSnapshotsServer;

    beforeEach(() => {
        server = new MockSnapshotsServer();
    });

    function device(i: number) {
        return {
            ikPub: Buffer.from(`ikPub${i}`)
        };
    }

    function opAdd(i: number) {
        return {
            type: 'add',
            ikPub: Buffer.from(`ikPub${i}`),
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            ts: expect.any(Number),
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            kid: expect.any(Buffer),
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            sig: expect.any(Buffer)
        };
    }

    function opRevoke(i: number) {
        return {
            type: 'revoke',
            ikPub: Buffer.from(`ikPub${i}`),
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            ts: expect.any(Number),
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            kid: expect.any(Buffer),
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            sig: expect.any(Buffer)
        };
    }

    function add(ctx: MachineContext, i: number) {
        return ctx.container.deviceManager.addDevice(
            {
                ikPub: Buffer.from(`ikPub${i}`)
            },
            ctx.container.keyServiceFactory.createDmkSignerService(ctx.secureEncryptedStorage)
        );
    }

    function addPub(ctx: MachineContext, ikPub: Buffer) {
        return ctx.container.deviceManager.addDevice(
            {
                ikPub
            },
            ctx.container.keyServiceFactory.createDmkSignerService(ctx.secureEncryptedStorage)
        );
    }

    function revoke(ctx: MachineContext, i: number) {
        return ctx.container.deviceManager.revokeDevice(
            Buffer.from(`ikPub${i}`),
            ctx.container.keyServiceFactory.createDmkSignerService(ctx.secureEncryptedStorage)
        );
    }

    function revokePub(ctx: MachineContext, ikPub: Buffer) {
        return ctx.container.deviceManager.revokeDevice(
            ikPub,
            ctx.container.keyServiceFactory.createDmkSignerService(ctx.secureEncryptedStorage)
        );
    }

    it('adds 1 device', async () => {
        const ctx = await createMachineContext(server);

        expect(await ctx.container.deviceManager.getDevices()).toEqual([]);

        await add(ctx, 1);

        expect(await ctx.container.deviceManager.getDevices()).toEqual([device(1)]);

        expect(await ctx.container.yManager.getDeviceLog()).toEqual([opAdd(1)]);
    });

    it('adds 10 devices', async () => {
        const ctx = await createMachineContext(server);

        expect(await ctx.container.deviceManager.getDevices()).toEqual([]);

        for (let i = 0; i < 10; i++) {
            await add(ctx, i);
        }

        expect(await ctx.container.deviceManager.getDevices()).toEqual(
            Array.from({ length: 10 }, (_, i) => device(i))
        );
    });

    it('adds 2 devices and revokes 1', async () => {
        const ctx = await createMachineContext(server);

        expect(await ctx.container.deviceManager.getDevices()).toEqual([]);

        for (let i = 1; i <= 2; i++) {
            await add(ctx, i);
        }

        const devices = await ctx.container.deviceManager.getDevices();
        expect(devices).toEqual([device(1), device(2)]);

        await revoke(ctx, 1);

        expect(await ctx.container.deviceManager.getDevices()).toEqual([device(2)]);

        expect(await ctx.container.yManager.getDeviceLog()).toEqual([
            opAdd(1),
            opAdd(2),
            opRevoke(1)
        ]);
    });

    it('applies other device updates', async () => {
        const masterKey = getMasterKey(5);
        const ik1 = ed25519_keygen();
        const ik2 = ed25519_keygen();

        const ctx1 = await createMachineContext(server, masterKey, ik1);
        const ctx2 = await createMachineContext(server, masterKey, ik2);

        await addPub(ctx1, ik1.publicKey);
        await addPub(ctx1, ik2.publicKey);

        expect(await ctx1.container.deviceManager.getDevices()).toEqual([
            { ikPub: ik1.publicKey },
            { ikPub: ik2.publicKey }
        ]);

        const deviceLog1_1 = await ctx1.container.yManager.getDeviceLog();

        await ctx2.container.deviceManager.verifyDeviceOpAndApply(deviceLog1_1[0]);
        await ctx2.container.deviceManager.verifyDeviceOpAndApply(deviceLog1_1[1]);

        expect(await ctx2.container.deviceManager.getDevices()).toEqual([
            { ikPub: ik1.publicKey },
            { ikPub: ik2.publicKey }
        ]);

        await revokePub(ctx1, ik1.publicKey);

        expect(await ctx1.container.deviceManager.getDevices()).toEqual([{ ikPub: ik2.publicKey }]);

        const deviceLog2_2 = await ctx1.container.yManager.getDeviceLog();

        await ctx2.container.deviceManager.verifyDeviceOpAndApply(deviceLog2_2[2]);

        expect(await ctx2.container.deviceManager.getDevices()).toEqual([{ ikPub: ik2.publicKey }]);
    });
});
