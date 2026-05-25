import { beforeEach, describe, expect, it } from 'vitest';

import { MockSnapshotsServer } from './mocks/mock-snapshots-api';
import type { MachineContext } from './mocks/mock-sync-context';
import { createMachineContext, getMasterKey, waitFor } from './mocks/mock-sync-context';
import { ed25519_keygen } from '../src/crypto/ed25519';
import {
    DeviceAlreadyExistsError,
    ReconnectFromAnotherAccountError
} from '../src/device-manager/device-management-service';
import { OfflineSyncProvider } from '../src/sync-provider/offline-sync-provider';
import { getKID } from '../src/utils/kid';

describe('device management service', () => {
    let server: MockSnapshotsServer;

    beforeEach(() => {
        server = new MockSnapshotsServer();
    });

    function deviceIkPub(i: number) {
        return Buffer.from(`ikPub${i}`);
    }

    function add(ctx: MachineContext, i: number) {
        return ctx.container.deviceManager.addDevice(
            Buffer.from(`ikPub${i}`),
            ctx.container.keyServiceFactory.createDmkSignerService(ctx.secureEncryptedStorage)
        );
    }

    function addPub(ctx: MachineContext, ikPub: Buffer) {
        return ctx.container.deviceManager.addDevice(
            ikPub,
            ctx.container.keyServiceFactory.createDmkSignerService(ctx.secureEncryptedStorage)
        );
    }

    function revokePub(ctx: MachineContext, ikPub: Buffer) {
        return ctx.container.deviceManager.revokeDevice(
            ikPub,
            ctx.container.keyServiceFactory.createDmkSignerService(ctx.secureEncryptedStorage)
        );
    }

    async function verifyDeviceList(ctx: MachineContext, expectedDevices: Buffer[]) {
        const devices = await ctx.container.deviceManager.getDevices();
        expect(devices).toHaveLength(expectedDevices.length);
        for (const expectedDevice of expectedDevices) {
            const device = devices.find(d => d.info.ikPub.equals(expectedDevice));
            expect(device).toEqual({
                info: {
                    ikPub: expectedDevice,
                    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                    addedAt: expect.any(Number)
                },
                // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
                sign: expect.any(Buffer)
            });
        }
        // verify that list is sorted by addedAt
        for (let i = 1; i < devices.length; i++) {
            expect(devices[i].info.addedAt).toBeGreaterThanOrEqual(devices[i - 1].info.addedAt);
        }
    }

    async function verifyStoredDeviceState(
        ctx: MachineContext,
        ikPub: Buffer,
        expectedType: 'active' | 'added' | 'revoked'
    ) {
        const devices = await ctx.container.deviceRepository.getStoredDevices();
        expect(devices[getKID(ikPub)]?.type).toBe(expectedType);
    }

    it('adds device as added and hides it from public list', async () => {
        const ctx = await createMachineContext(server);

        expect(await ctx.container.deviceManager.getDevices()).toEqual([]);

        await add(ctx, 1);

        expect(await ctx.container.deviceManager.getDevices()).toEqual([]);
        await verifyStoredDeviceState(ctx, deviceIkPub(1), 'added');
    });

    it('activates this device', async () => {
        const ctx = await createMachineContext(server);
        const ikPub = ctx.container.ikService.getPub();

        await addPub(ctx, ikPub);
        await verifyStoredDeviceState(ctx, ikPub, 'added');

        await ctx.container.deviceManager.activate();

        await verifyDeviceList(ctx, [ikPub]);
        await verifyStoredDeviceState(ctx, ikPub, 'active');
    });

    it('notifies when devices change', async () => {
        const ctx = await createMachineContext(server);
        const provider = new OfflineSyncProvider(ctx.container as never);
        const ikPub = ctx.container.ikService.getPub();
        const seen: Buffer[][] = [];
        const unsubscribe = provider.onDevicesChange(devices => {
            seen.push(devices.map(device => device.info.ikPub));
        });

        await addPub(ctx, ikPub);
        await waitFor(() => seen.length === 1);
        expect(seen[0]).toEqual([]);

        await ctx.container.deviceManager.activate();
        await waitFor(() => seen.length === 2);
        expect(seen[1]).toHaveLength(1);
        expect(seen[1][0].equals(ikPub)).toBe(true);

        unsubscribe();
        await revokePub(ctx, ikPub);
        await new Promise(resolve => setTimeout(resolve, 20));
        expect(seen).toHaveLength(2);
    });

    it('adds 10 devices', async () => {
        const ctx = await createMachineContext(server);

        for (let i = 0; i < 10; i++) {
            await add(ctx, i);
        }

        expect(await ctx.container.deviceManager.getDevices()).toEqual([]);
        for (let i = 0; i < 10; i++) {
            await verifyStoredDeviceState(ctx, deviceIkPub(i), 'added');
        }
    });

    it('adds 2 devices and revokes 1', async () => {
        const ctx = await createMachineContext(server);
        const ikPub = ctx.container.ikService.getPub();

        expect(await ctx.container.deviceManager.getDevices()).toEqual([]);

        await addPub(ctx, ikPub);
        await ctx.container.deviceManager.activate();
        await add(ctx, 2);

        await verifyDeviceList(ctx, [ikPub]);
        await verifyStoredDeviceState(ctx, deviceIkPub(2), 'added');
        await revokePub(ctx, ikPub);

        await verifyDeviceList(ctx, []);
        await verifyStoredDeviceState(ctx, ikPub, 'revoked');
    });

    it('allows reconnect only for revoked devices', async () => {
        const ctx = await createMachineContext(server);
        const ikPub = ctx.container.ikService.getPub();
        const addedIkPub = deviceIkPub(2);

        await expect(ctx.container.deviceManager.assertDeviceCanReconnect(ikPub)).rejects.toThrow(
            ReconnectFromAnotherAccountError
        );

        await addPub(ctx, addedIkPub);
        await expect(
            ctx.container.deviceManager.assertDeviceCanReconnect(addedIkPub)
        ).rejects.toThrow(DeviceAlreadyExistsError);

        await addPub(ctx, ikPub);
        await ctx.container.deviceManager.activate();
        await expect(ctx.container.deviceManager.assertDeviceCanReconnect(ikPub)).rejects.toThrow(
            DeviceAlreadyExistsError
        );

        await revokePub(ctx, ikPub);
        await expect(ctx.container.deviceManager.assertDeviceCanReconnect(ikPub)).resolves.toBe(
            undefined
        );
    });

    it('applies other device updates', async () => {
        const masterKey = getMasterKey(5);
        const ik1 = ed25519_keygen();
        const ik2 = ed25519_keygen();

        const ctx1 = await createMachineContext(server, masterKey, ik1);
        const ctx2 = await createMachineContext(server, masterKey, ik2);

        await addPub(ctx1, ik1.publicKey);
        await ctx1.container.deviceManager.activate();
        await addPub(ctx1, ik2.publicKey);

        await verifyDeviceList(ctx1, [ik1.publicKey]);
        await verifyStoredDeviceState(ctx1, ik2.publicKey, 'added');

        await ctx2.container.deviceManager.mergeDeviceStorage(
            ctx1.container.deviceYManager.encodeAsSnapshot()
        );
        await ctx2.container.deviceManager.activate();

        await verifyDeviceList(ctx2, [ik1.publicKey, ik2.publicKey]);
        await verifyStoredDeviceState(ctx2, ik2.publicKey, 'active');

        await ctx1.container.deviceManager.mergeDeviceStorage(
            ctx2.container.deviceYManager.encodeAsSnapshot()
        );

        await revokePub(ctx1, ik1.publicKey);
        await verifyDeviceList(ctx1, [ik2.publicKey]);

        await ctx2.container.deviceManager.mergeDeviceStorage(
            ctx1.container.deviceYManager.encodeAsSnapshot()
        );

        await verifyDeviceList(ctx2, [ik2.publicKey]);
    });
});
