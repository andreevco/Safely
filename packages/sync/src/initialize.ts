import { randomBytes } from '@noble/ciphers/utils.js';
import { ed25519 } from '@noble/curves/ed25519.js';
import { hkdf } from '@noble/hashes/hkdf.js';
import { sha256 } from '@noble/hashes/sha2.js';
import * as Y from 'yjs';

import { YCRDT } from './crdt/y-crdt';
import { YCRDTRepository } from './crdt/y-crdt-repository';
import { KeyRepository } from './crypto/key-repository';
import { IStorage } from './I-storage';
import { SyncStateRepository } from './update-handler/sync-state-repository';
import { utf8 } from './utils/buffer';

export async function generateMasterKey(): Promise<Buffer> {
    return Buffer.from(randomBytes(32));
}

export async function generateAccountID(masterKey: Buffer): Promise<string> {
    const accountID = hkdf(sha256, masterKey, undefined, utf8('safely/sync/v1/account-id'), 32);
    return Buffer.from(accountID).toString('hex');
}

export async function initializeSyncState(repo: SyncStateRepository): Promise<void> {
    await repo.saveState({
        snapshotProof: Buffer.from([])
    });
}

export async function initializeKeys(
    repo: KeyRepository,
    masterKey: Buffer,
    ik?: { secretKey: Buffer; publicKey: Buffer }
): Promise<void> {
    const syncKey = hkdf(sha256, masterKey, undefined, utf8('safely/sync/v1/sync-key'), 32);
    const vaultKey = hkdf(sha256, masterKey, undefined, utf8('safely/sync/v1/vault-key'), 32);
    const dmkSeed = hkdf(sha256, masterKey, undefined, utf8('safely/sync/v1/dmk-seed'), 32);
    const dmkKeypair = ed25519.keygen(dmkSeed);

    const identityKey = ik ? ik : ed25519.keygen();
    await repo.initialize({
        masterKey: Buffer.from(masterKey),
        vaultKey: Buffer.from(vaultKey),
        dmkPub: Buffer.from(dmkKeypair.publicKey),
        dmkPrv: Buffer.from(dmkKeypair.secretKey),
        selfIKPub: Buffer.from(identityKey.publicKey),
        selfIKPrv: Buffer.from(identityKey.secretKey),
        syncKey: Buffer.from(syncKey)
    });
}

export async function initializeCrdt(repo: YCRDTRepository): Promise<void> {
    await repo.saveCRDT(new YCRDT(new Y.Doc()));
}

export async function initializeSyncAccount(
    storage: IStorage,
    keychainStorage: IStorage,
    masterKey: Buffer,
    ik?: { secretKey: Buffer; publicKey: Buffer }
): Promise<void> {
    const keyRepository = new KeyRepository(keychainStorage);
    const syncStateRepository = new SyncStateRepository(storage);
    const ycrdtRepository = new YCRDTRepository(storage);

    await initializeKeys(keyRepository, masterKey, ik);
    await initializeSyncState(syncStateRepository);
    await initializeCrdt(ycrdtRepository);
}
