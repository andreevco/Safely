import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import type { AssertVersionHList, HCons, StorageVersion } from '@safely/slottree';
import { defineVersionHList, hCons, hNil, projectIdentity } from '@safely/slottree';

import { projection } from '../../../slottree/src/core/versioning/projection';
import type { ISyncAccount } from '../../src';
import { SyncAccountFactory } from '../../src';
import { Logger } from '../../src/logger/logger';
import { QRMessageCodec, QRMessageOperation } from '../../src/onboarding/onboarding-codec';
import type { SyncApiImplementations } from '../../src/sync-container';
import { InMemStorage } from '../impl/storage';
import { SyncServer } from '../impl/sync-server';
import { createSyncServerApiImplementations } from '../impl/sync-server-api-implementations';

const walletSchema = z.object({
    __setId: z.string(),
    value: z.string()
});
type WalletItem = z.output<typeof walletSchema>;

const schemaV1 = z.object({
    wallets: z.array(walletSchema)
});

const schemaV2 = z.object({
    wallets: z.array(walletSchema),
    newField: z.string().default('new-field-initial')
});

const projectV1ToV2 = projection(schemaV1, schemaV2, s => ({
    wallets: s.copy(),
    newField: s.default('new-field-initial')
}));

const projectV2ToV1 = projection(schemaV2, schemaV1, s => ({
    wallets: s.copy()
}));

const accountV1 = {
    version: 1,
    schema: schemaV1,
    initial: {
        wallets: [] as WalletItem[]
    },
    projectUp: projectIdentity,
    projectDown: projectIdentity
} as const;

const accountV2 = {
    version: 2,
    schema: schemaV2,
    initial: {
        wallets: [] as WalletItem[],
        newField: 'new-field-initial'
    },
    projectUp: projectV1ToV2,
    projectDown: projectV2ToV1
} as const;

const versionsV1 = defineVersionHList(hCons(accountV1, hNil));
const versionsV2 = defineVersionHList(hCons(accountV2, hCons(accountV1, hNil)));

type VersionHList = HCons<StorageVersion, unknown>;

type VersionedFactory<Versions extends VersionHList> = {
    factory: SyncAccountFactory<Versions>;
    secureEncryptedStorage: InMemStorage;
    setRequesterIk: (ikPub: Buffer) => void;
    setRequesterIkFromOnboardingData: (data: Buffer) => void;
};

describe('versioned onboarding', () => {
    let server: SyncServer;
    const accounts: Array<ISyncAccount<StorageVersion>> = [];

    beforeEach(() => {
        server = new SyncServer();
        accounts.length = 0;
    });

    afterEach(() => {
        for (const account of accounts) {
            account.syncProvider.dispose();
        }
    });

    it('shows v2 device data on a newly onboarded v1 device', async () => {
        const deviceA = makeVersionedFactory(versionsV2);
        const deviceB = makeVersionedFactory(versionsV1);
        const accountA = await deviceA.factory.createSyncAccount(deviceA.secureEncryptedStorage);
        accounts.push(accountA);

        await accountA.syncProvider.transaction(draft => {
            draft.set('wallets', walletItems('wallet-a'));
            draft.set('newField', 'from-v2');
        });

        const accountB = await onboardDevice(accountA, deviceA, deviceB);
        accounts.push(accountB);

        await vi.waitFor(() => {
            expect(accountB.syncProvider.get('wallets')).toEqual(walletItems('wallet-a'));
        });
    });

    it('shows v1 device data and v2 initial field on a newly onboarded v2 device', async () => {
        const deviceA = makeVersionedFactory(versionsV1);
        const deviceB = makeVersionedFactory(versionsV2);
        const accountA = await deviceA.factory.createSyncAccount(deviceA.secureEncryptedStorage);
        accounts.push(accountA);

        await accountA.syncProvider.transaction(draft => {
            draft.set('wallets', walletItems('wallet-a'));
        });

        const accountB = await onboardDevice(accountA, deviceA, deviceB);
        accounts.push(accountB);

        await vi.waitFor(() => {
            expect(accountB.syncProvider.get('wallets')).toEqual(walletItems('wallet-a'));
            expect(accountB.syncProvider.get('newField')).toBe('new-field-initial');
        });
    });

    function makeVersionedFactory<Versions extends VersionHList>(
        versions: Versions & AssertVersionHList<Versions>
    ): VersionedFactory<Versions> {
        const storage = new InMemStorage();
        const encryptedStorage = new InMemStorage();
        const secureEncryptedStorage = new InMemStorage();
        let requesterIk: string | undefined;
        const apiImplementations: SyncApiImplementations = createSyncServerApiImplementations(
            server,
            () => {
                if (!requesterIk) {
                    throw new Error('Requester IK is not set');
                }

                return requesterIk;
            }
        );
        const logger = new Logger({ log: () => undefined });

        return {
            factory: new SyncAccountFactory<Versions>({
                storage,
                encryptedStorage,
                versions,
                apiConfiguration: {
                    basePath: 'sync-server://mock'
                },
                apiImplementations,
                pollingTimeout: 1,
                noAccountLogger: logger,
                getAccountLogger: () => logger
            }),
            secureEncryptedStorage,
            setRequesterIk: ikPub => {
                requesterIk = ikPub.toString('hex');
            },
            setRequesterIkFromOnboardingData: data => {
                const onboardingMessage = QRMessageCodec.decode(data);
                if (onboardingMessage.type !== QRMessageOperation.NEW_DEVICE_ONBOARDING) {
                    throw new Error('Unexpected onboarding message type');
                }

                requesterIk = onboardingMessage.ikPub.toString('hex');
            }
        };
    }
});

async function onboardDevice<
    ExistingLatest extends StorageVersion,
    NewLatest extends StorageVersion
>(
    existingAccount: ISyncAccount<ExistingLatest>,
    existingDevice: VersionedFactory<VersionHList>,
    newDevice: VersionedFactory<VersionHList>
): Promise<ISyncAccount<NewLatest>> {
    const onboardingConnector = await newDevice.factory.connectToExistingSyncAccount(
        newDevice.secureEncryptedStorage
    );

    existingDevice.setRequesterIk(existingAccount.getMyDeviceIkPub());
    newDevice.setRequesterIkFromOnboardingData(onboardingConnector.data);

    const primaryOnboarding = existingAccount.connectToNewDevice(
        onboardingConnector.data,
        existingDevice.secureEncryptedStorage
    );
    const [newAccount] = await Promise.all([
        onboardingConnector.waitForCompletion(),
        primaryOnboarding
    ]);

    return newAccount as ISyncAccount<NewLatest>;
}

function walletItems(...values: string[]) {
    return values.map(value => ({
        __setId: value,
        value
    }));
}
