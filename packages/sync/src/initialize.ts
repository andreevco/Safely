import { randomBytes } from '@noble/ciphers/utils.js';
import { ed25519 } from '@noble/curves/ed25519.js';
import { hkdf } from '@noble/hashes/hkdf.js';
import { sha256 } from '@noble/hashes/sha2.js';
import * as Y from 'yjs';
import { ZodType } from 'zod';

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

export async function initializeSyncState(repo: SyncStateRepository): Promise<void> {
    await repo.saveState({
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
    schema: Record<string, ZodType>
): Promise<void> {
    await repo.saveCRDT(new YCRDT(new Y.Doc(), schema));
}

export async function initializeSyncAccount(opts: {
    storage: IStorage;
    encryptedStorage: IStorage;
    secureEncryptedStorage: IStorage;
    structure: Record<string, ZodType>;
    masterKey: Buffer;
    logger: Logger;
    ik?: { secretKey: Buffer; publicKey: Buffer };
}): Promise<void> {
    const encryptedKeyRepository = new EncryptedKeyRepository(opts.encryptedStorage);
    const secureEncryptedKeyRepository = new SecureEncryptedKeyRepository(
        opts.secureEncryptedStorage
    );
    const syncStateRepository = new SyncStateRepository(opts.storage, opts.logger);
    const ycrdtRepository = new YCRDTRepository(opts.storage, opts.structure);

    await initializeKeys(
        encryptedKeyRepository,
        secureEncryptedKeyRepository,
        opts.masterKey,
        opts.ik
    );
    await initializeSyncState(syncStateRepository);
    await initializeCrdt(ycrdtRepository, opts.structure);
}
