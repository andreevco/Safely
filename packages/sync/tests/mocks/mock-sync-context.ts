import { createActor } from 'xstate';
import { z } from 'zod';

import { MockSnapshotsServer } from './mock-snapshots-api';
import { createMockSyncContainer, MockSyncContainer } from './mock-sync-container';
import { SyncStatus } from '../../src';
import { SnapshotsApi } from '../../src/api/generated';
import { SnapshotsSse } from '../../src/api/snapshots-sse';
import {
    chainToRuntimeArray,
    defineStorageVersion,
    defineVersionChain
} from '../../src/crdt/version';
import { ed25519_keygen } from '../../src/crypto/ed25519';
import {
    generateAccountID,
    initializeSyncAccount,
    initializeSyncState
} from '../../src/initialize';
import { Logger } from '../../src/logger/logger';
import { createSyncMachine, SyncMachine } from '../../src/sync-machine/machine';
import { SyncStatusManager } from '../../src/sync-provider/sync-status';
import { SyncStateRepository } from '../../src/update-handler/sync-state-repository';
import { InMemStorage } from '../impl/storage';

export type MachineContext = {
    container: MockSyncContainer;
    machine: SyncMachine;
    secureEncryptedStorage: InMemStorage;
};

export async function createMachineContext(
    server: MockSnapshotsServer,
    masterKeyOpt?: Buffer,
    ikOpt?: { secretKey: Buffer; publicKey: Buffer },
    expectedSubscriberIncrease = 1,
    bootstrapSelfDevice = false
): Promise<MachineContext> {
    const masterKey = masterKeyOpt ?? Buffer.alloc(32, 0);
    const storage = new InMemStorage();
    const encryptedStorage = new InMemStorage();
    const secureEncryptedStorage = new InMemStorage();
    const accountId = await generateAccountID(masterKey);
    const accountStorage = storage.child(accountId);
    const accountEncryptedStorage = encryptedStorage.child(accountId);
    const accountSecureEncryptedStorage = secureEncryptedStorage.child(accountId);
    const logger = new Logger();
    const structure = { value: z.string() };
    const version1 = defineStorageVersion<{}, typeof structure>({
        version: 1,
        schema: structure,
        migrate: () => ({ value: '' }),
        reverseMigrate: () => ({})
    });
    const versions = chainToRuntimeArray(defineVersionChain(version1));
    const ik = ikOpt ?? ed25519_keygen(masterKey);
    await initializeSyncAccount({
        storage: accountStorage,
        versions,
        encryptedStorage: accountEncryptedStorage,
        secureEncryptedStorage: accountSecureEncryptedStorage,
        masterKey,
        logger,
        ik,
        firstTime: true
    });
    await initializeSyncState(new SyncStateRepository(accountStorage, logger), false);
    const container = await createMockSyncContainer(
        accountStorage,
        accountEncryptedStorage,
        server,
        accountId,
        logger,
        versions
    );
    if (bootstrapSelfDevice) {
        const selfIkPub = await container.ikService.getPub();
        await container.deviceRepository.setDevices([{ ikPub: selfIkPub, addedAt: Date.now() }]);
    }
    if (!server.hasSnapshot()) {
        const encrypted = await container.updateEncryptor.encryptAndSign(
            container.yManager.encodeAsSnapshot()
        );
        await server.seedFromSnapshot(encrypted);
    }

    const syncStatusManager = new SyncStatusManager(SyncStatus.DISCONNECTED);
    const machine = createActor(createSyncMachine(), {
        input: {
            syncStateRepository: container.syncStateRepository,
            updateHandler: container.updateHandler,
            yManager: container.yManager,
            updateEncryptor: container.updateEncryptor,
            snapshotsApi: container.snapshotApi as unknown as SnapshotsApi,
            snapshotsSse: container.snapshotSse as unknown as SnapshotsSse,
            ikService: container.ikService,
            syncStatusManager,
            logger: logger
        }
    });

    const baseSubscribers = server.subscriberCount;
    machine.start();

    await waitFor(() => server.subscriberCount === baseSubscribers + expectedSubscriberIncrease);
    await waitForSnapshotSync(container, server);

    return { container, machine, secureEncryptedStorage };
}

export async function waitFor(
    predicate: () => boolean | Promise<boolean>,
    timeoutMs = 2000
): Promise<void> {
    const started = Date.now();
    // small delay to give async work a chance to settle on the happy path
    do {
        if (await predicate()) {
            return;
        }
        await delay(10);
    } while (Date.now() - started < timeoutMs);

    throw new Error('Timed out waiting for condition');
}

function delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export async function waitForSnapshotSync(
    container: MockSyncContainer,
    server: MockSnapshotsServer
): Promise<void> {
    await waitFor(async () => {
        const syncState = await container.syncStateRepository.getState();
        return syncState.snapshotProof.equals(server.getLatestSnapshotProof());
    });
}

export async function sendLocalUpdate(
    ctx: MachineContext,
    server: MockSnapshotsServer,
    key: string,
    value: string
): Promise<void> {
    const initialSnapshots = server.snapshotCount;
    await ctx.container.yManager.set(key, value);
    ctx.machine.send({ type: 'LOCAL_UPDATE' });

    await waitFor(() => server.snapshotCount === initialSnapshots + 1);
    await waitForSnapshotSync(ctx.container, server);
}

export function getMasterKey(seed: number): Buffer {
    return Buffer.alloc(32, seed);
}
