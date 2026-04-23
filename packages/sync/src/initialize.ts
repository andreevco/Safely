import { randomBytes } from '@noble/ciphers/utils.js';
import { ed25519 } from '@noble/curves/ed25519.js';
import { hkdf } from '@noble/hashes/hkdf.js';
import { sha256 } from '@noble/hashes/sha2.js';
import * as Y from 'yjs';

import { AnyStorageVersion } from './crdt/version';
import { YCRDT } from './crdt/y-crdt';
import { YCRDTRepository } from './crdt/y-crdt-repository';
import { EncryptedKeyRepository } from './crypto/encrypted-key-repository';
import { SecureEncryptedKeyRepository } from './crypto/secure-encrypted-key-repository';
import { IStorage } from './I-storage';
import { Logger } from './logger/logger';
import { SyncStateRepository } from './update-handler/sync-state-repository';
import { utf8 } from './utils/buffer';

export async function generateMasterKey(): Promise<Buffer> {
    return Buffer.from(randomBytes(32));
}

export async function generateAccountID(masterKey: Buffer): Promise<string> {
    const accountID = hkdf(sha256, masterKey, undefined, utf8('safely/sync/v1/account-id'), 32);
    return Buffer.from(accountID).slice(0, 16).toString('hex');
}

export async function initializeSyncState(
    repo: SyncStateRepository,
    firstTime: boolean
): Promise<void> {
    await repo.saveState({
        initialized: firstTime,
        snapshotProof: Buffer.from([])
    });
}

export async function initializeKeys(
    encryptedKeyRepository: EncryptedKeyRepository,
    secureEncryptedKeyRepository: SecureEncryptedKeyRepository,
    masterKey: Buffer,
    ik?: { secretKey: Buffer; publicKey: Buffer }
): Promise<void> {
    const syncKey = hkdf(sha256, masterKey, undefined, utf8('safely/sync/v1/sync-key'), 32);
    const vaultKey = hkdf(sha256, masterKey, undefined, utf8('safely/sync/v1/vault-key'), 32);
    const dmkSeed = hkdf(sha256, masterKey, undefined, utf8('safely/sync/v1/dmk-seed'), 32);
    const dmkKeypair = ed25519.keygen(dmkSeed);

    const identityKey = ik ? ik : ed25519.keygen();
    await encryptedKeyRepository.initialize({
        dmkPub: Buffer.from(dmkKeypair.publicKey),
        selfIKPub: Buffer.from(identityKey.publicKey),
        selfIKPrv: Buffer.from(identityKey.secretKey),
        syncKey: Buffer.from(syncKey)
    });
    await secureEncryptedKeyRepository.initialize({
        masterKey: Buffer.from(masterKey),
        vaultKey: Buffer.from(vaultKey),
        dmkPrv: Buffer.from(dmkKeypair.secretKey)
    });
}

export async function initializeCrdt(
    repo: YCRDTRepository,
    versions: AnyStorageVersion[],
    myDeviceId: string,
    firstTime: boolean
): Promise<void> {
    const doc = new Y.Doc();
    const crdt = YCRDT.create(doc, versions, myDeviceId);
    if (firstTime) {
        const system = doc.getMap('system');
        system.set('devices', new Y.Array());
        system.set('versions', new Y.Map());
    }
    await repo.saveCRDT(crdt);
}

export async function initializeSyncAccount(opts: {
    storage: IStorage;
    encryptedStorage: IStorage;
    secureEncryptedStorage: IStorage;
    versions: AnyStorageVersion[];
    masterKey: Buffer;
    logger: Logger;
    firstTime: boolean;
    ik?: { secretKey: Buffer; publicKey: Buffer };
}): Promise<void> {
    const encryptedKeyRepository = new EncryptedKeyRepository(opts.encryptedStorage);
    const secureEncryptedKeyRepository = new SecureEncryptedKeyRepository(
        opts.secureEncryptedStorage
    );
    const syncStateRepository = new SyncStateRepository(opts.storage, opts.logger);

    await initializeKeys(
        encryptedKeyRepository,
        secureEncryptedKeyRepository,
        opts.masterKey,
        opts.ik
    );

    const deviceId = (await encryptedKeyRepository.getIKPub()).toString('hex');
    const ycrdtRepository = new YCRDTRepository(opts.storage, opts.versions, deviceId);

    await initializeSyncState(syncStateRepository, opts.firstTime);
    await initializeCrdt(ycrdtRepository, opts.versions, deviceId, opts.firstTime);
}
