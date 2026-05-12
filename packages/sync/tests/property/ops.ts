import fc from 'fast-check';
import { expect, vi } from 'vitest';

import type { Device } from '../../src/device-manager/device-repository';
import { SyncStatus } from '../../src/sync-provider/sync-status';
import { InMemStorage } from '../impl/storage';
import { makeFactory } from '../impl/sync-server-factory';
import { initializeSyncServer } from '../impl/sync-server-registry';
import type { TestSyncAccount } from '../integrational/helpers';

type MockFactory = ReturnType<typeof makeFactory>;

const WAIT_TIMEOUT_MS = 2000;

let nextWalletIndex = 0;

export type SyncTestDevice = {
    account: TestSyncAccount;
    factory: MockFactory;
    secureEncryptedStorage: InMemStorage;
    online: boolean;
};

type RemoveDeviceSelector = {
    actorIndex: number;
    targetIndex: number;
};

export type Op =
    | {
          type: 'device.addOnlineFromOnline';
          actorIndex: number;
      }
    | {
          type: 'device.removeOnlineFromOnline';
          actorIndex: number;
          targetIndex: number;
      }
    | {
          type: 'device.removeOfflineFromOnline';
          actorIndex: number;
          targetIndex: number;
      }
    | {
          type: 'data.changeOnActiveDevice';
          actorIndex: number;
      }
    | {
          type: 'device.returnOfflineOnline';
          targetIndex: number;
      }
    | {
          type: 'device.takeOnlineOffline';
          targetIndex: number;
      };

const deviceIndexArb = fc.nat(20);

export const opArb = fc.oneof(
    deviceIndexArb.map(actorIndex => ({
        type: 'device.addOnlineFromOnline',
        actorIndex
    })),

    fc
        .record({
            actorIndex: deviceIndexArb,
            targetIndex: deviceIndexArb
        })
        .map(({ actorIndex, targetIndex }) => ({
            type: 'device.removeOnlineFromOnline',
            actorIndex,
            targetIndex
        })),

    fc
        .record({
            actorIndex: deviceIndexArb,
            targetIndex: deviceIndexArb
        })
        .map(({ actorIndex, targetIndex }) => ({
            type: 'device.removeOfflineFromOnline',
            actorIndex,
            targetIndex
        })),

    deviceIndexArb.map(actorIndex => ({
        type: 'data.changeOnActiveDevice',
        actorIndex
    })),

    deviceIndexArb.map(targetIndex => ({
        type: 'device.returnOfflineOnline',
        targetIndex
    })),

    deviceIndexArb.map(targetIndex => ({
        type: 'device.takeOnlineOffline',
        targetIndex
    }))
) as fc.Arbitrary<Op>;

export const opsArb = fc.array(opArb, { minLength: 30, maxLength: 50 });

export async function applyOp(devices: SyncTestDevice[], op: Op): Promise<void> {
    switch (op.type) {
        case 'device.addOnlineFromOnline': {
            await addOnlineDeviceFromOnlineDevice(devices, op);
            await waitForOnlineDevicesSynced(devices);
            return;
        }

        case 'device.removeOnlineFromOnline': {
            await removeDeviceFromOnlineDevice(devices, op);
            await waitForOnlineDevicesSynced(devices);
            return;
        }

        case 'device.removeOfflineFromOnline': {
            await removeDeviceFromOnlineDevice(devices, op);
            await waitForOnlineDevicesSynced(devices);
            return;
        }

        case 'data.changeOnActiveDevice': {
            await changeDataOnActiveDevice(devices, op);
            await waitForOnlineDevicesSynced(devices);
            return;
        }

        case 'device.returnOfflineOnline': {
            await returnOfflineDeviceOnline(devices, op);
            await waitForOnlineDevicesSynced(devices);
            return;
        }

        case 'device.takeOnlineOffline': {
            takeOnlineDeviceOffline(devices, op);
            return;
        }

        default:
            return;
    }
}

export async function applyOps(devices: SyncTestDevice[], ops: Op[]): Promise<void> {
    for (const op of ops) {
        await applyOp(devices, op);
    }
}

export async function makeInitialDevices(): Promise<SyncTestDevice[]> {
    initializeSyncServer();
    nextWalletIndex = 0;

    const primaryFactory = makeFactory();
    const primarySecureEncryptedStorage = new InMemStorage();
    const primaryAccount = await primaryFactory.factory.createSyncAccount(
        primarySecureEncryptedStorage
    );
    const primaryDevice: SyncTestDevice = {
        account: primaryAccount,
        factory: primaryFactory,
        secureEncryptedStorage: primarySecureEncryptedStorage,
        online: false
    };

    const secondaryDevice = await onboardMockDevice(primaryDevice);
    primaryDevice.online = true;

    await waitForOnlineDevicesSynced([primaryDevice, secondaryDevice]);
    return [primaryDevice, secondaryDevice];
}

export async function waitForOnlineDevicesSynced(devices: SyncTestDevice[]): Promise<void> {
    const onlineDevices = devices.filter(device => device.online);
    if (onlineDevices.length === 0) {
        return;
    }

    await waitWithTimeout(
        Promise.all(
            onlineDevices.map(device =>
                device.account.syncProvider.syncStatusManager.waitForStatus(SyncStatus.SYNCHRONIZED)
            )
        ),
        'online devices synchronized status'
    );

    if (onlineDevices.length === 1) {
        return;
    }

    await vi.waitFor(
        async () => {
            const [referenceDevice, ...restDevices] = onlineDevices;
            const referenceWallets = referenceDevice.account.syncProvider.get('wallets');
            const referenceDevices = normalizeDevices(await referenceDevice.account.getDevices());

            for (const device of restDevices) {
                expect(device.account.syncProvider.get('wallets')).toEqual(referenceWallets);
                expect(normalizeDevices(await device.account.getDevices())).toEqual(
                    referenceDevices
                );
            }
        },
        {
            interval: 1,
            timeout: WAIT_TIMEOUT_MS
        }
    );
}

async function waitForStatusWithTimeout(
    device: SyncTestDevice,
    status: SyncStatus,
    label: string
): Promise<void> {
    await waitWithTimeout(
        device.account.syncProvider.syncStatusManager.waitForStatus(status),
        label
    );
}

async function waitWithTimeout<T>(promise: Promise<T>, label: string): Promise<T> {
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    const timeout = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
            reject(new Error(`Timed out after ${WAIT_TIMEOUT_MS}ms waiting for ${label}`));
        }, WAIT_TIMEOUT_MS);
    });

    try {
        return await Promise.race([promise, timeout]);
    } finally {
        if (timeoutId !== undefined) {
            clearTimeout(timeoutId);
        }
    }
}

async function addOnlineDeviceFromOnlineDevice(
    devices: SyncTestDevice[],
    op: Extract<Op, { type: 'device.addOnlineFromOnline' }>
): Promise<void> {
    const actor = pickOnlineDevice(devices, op.actorIndex);
    if (!actor) {
        return;
    }

    const newDevice = await onboardMockDevice(actor);
    await waitForStatusWithTimeout(newDevice, SyncStatus.SYNCHRONIZED, 'new device synchronized');
    devices.push(newDevice);
}

async function removeDeviceFromOnlineDevice(
    devices: SyncTestDevice[],
    selector: RemoveDeviceSelector
): Promise<void> {
    const onlineDevices = devices.filter(device => device.online);
    const actor = pickByIndex(onlineDevices, selector.actorIndex);
    if (!actor) {
        return;
    }

    const candidates = devices.filter(device => device !== actor);
    const target = pickByIndex(candidates, selector.targetIndex);
    if (!target) {
        return;
    }

    await setRequesterIk(actor);
    await actor.account.revokeRemoteDevice(
        await target.account.getMyDeviceIkPub(),
        actor.secureEncryptedStorage
    );

    target.account.syncProvider.dispose();

    const targetIndex = devices.indexOf(target);
    if (targetIndex !== -1) {
        devices.splice(targetIndex, 1);
    }
}

async function changeDataOnActiveDevice(
    devices: SyncTestDevice[],
    op: Extract<Op, { type: 'data.changeOnActiveDevice' }>
): Promise<void> {
    const actor = pickOnlineDevice(devices, op.actorIndex);
    if (!actor) {
        return;
    }

    await actor.account.syncProvider.transaction(draft => {
        const wallets = draft.at('wallets');
        const id = nextWalletId();
        wallets.push({
            __setId: id,
            value: id
        });
    });
}

async function returnOfflineDeviceOnline(
    devices: SyncTestDevice[],
    op: Extract<Op, { type: 'device.returnOfflineOnline' }>
): Promise<void> {
    const device = pickOfflineDevice(devices, op.targetIndex);
    if (!device) {
        return;
    }

    device.account.syncProvider.restart();
    await waitForStatusWithTimeout(device, SyncStatus.SYNCHRONIZED, 'returned device synchronized');
    device.online = true;
}

function takeOnlineDeviceOffline(
    devices: SyncTestDevice[],
    op: Extract<Op, { type: 'device.takeOnlineOffline' }>
): void {
    const device = pickOnlineDevice(devices, op.targetIndex);
    if (!device) {
        return;
    }

    device.account.syncProvider.dispose();
    device.online = false;
}

function pickOnlineDevice(devices: SyncTestDevice[], index: number): SyncTestDevice | undefined {
    return pickByIndex(
        devices.filter(device => device.online),
        index
    );
}

function pickOfflineDevice(devices: SyncTestDevice[], index: number): SyncTestDevice | undefined {
    return pickByIndex(
        devices.filter(device => !device.online),
        index
    );
}

function pickByIndex<T>(items: T[], index: number): T | undefined {
    if (items.length === 0) {
        return undefined;
    }

    return items[index % items.length];
}

function normalizeDevices(devices: Device[]) {
    return devices
        .map(device => ({
            ikPub: device.info.ikPub.toString('hex'),
            addedAt: device.info.addedAt,
            sign: device.sign.toString('hex')
        }))
        .sort((left, right) => left.ikPub.localeCompare(right.ikPub));
}

function nextWalletId(): string {
    return `wallet-${nextWalletIndex++}`;
}

async function onboardMockDevice(actor: SyncTestDevice): Promise<SyncTestDevice> {
    const newDeviceFactory = makeFactory();
    const newDeviceSecureEncryptedStorage = new InMemStorage();
    const connector = await newDeviceFactory.factory.connectToExistingSyncAccount(
        newDeviceSecureEncryptedStorage
    );

    newDeviceFactory.setRequesterIkFromOnboardingData(connector.data);
    await setRequesterIk(actor);

    const connectActor = actor.account.connectToNewDevice(
        connector.data,
        actor.secureEncryptedStorage
    );
    const [, newAccount] = await waitWithTimeout(
        Promise.all([connectActor, connector.waitForCompletion()]),
        'mock device onboarding'
    );

    await waitForStatusWithTimeout(actor, SyncStatus.SYNCHRONIZED, 'actor device synchronized');
    await waitWithTimeout(
        newAccount.syncProvider.syncStatusManager.waitForStatus(SyncStatus.SYNCHRONIZED),
        'new device synchronized'
    );

    return {
        account: newAccount,
        factory: newDeviceFactory,
        secureEncryptedStorage: newDeviceSecureEncryptedStorage,
        online: true
    };
}

async function setRequesterIk(device: SyncTestDevice): Promise<void> {
    device.factory.setRequesterIk((await device.account.getMyDeviceIkPub()).toString('hex'));
}
