import { sha256 } from '@noble/hashes/sha2.js';
import { describe, expect, it } from 'vitest';

import { SyncServer } from './sync-server';
import type { OnboardingMessage, Snapshot } from '../../../src/api/generated';
import { ed25519_keygen, ed25519_sign } from '../../../src/crypto/ed25519';
import {
    getServerAddDeviceSignaturePayload,
    getServerRevokeDeviceSignaturePayload
} from '../../../src/device-manager/device-signature-payload';
import { getSnapshotProofFromCiphertextHash } from '../../../src/update-handler/snapshot-proof';

describe('SyncServer', () => {
    it('stores onboarding messages and confirms them', () => {
        const server = new SyncServer();
        const accountId = '11'.repeat(16);
        const dmk = ed25519_keygen();
        const primaryIk = ed25519_keygen();
        const newIk = ed25519_keygen();

        server.createAccount({
            newAccount: {
                accountId,
                deviceManagementPubKey: dmk.publicKey.toString('hex'),
                identityPubKey: primaryIk.publicKey.toString('hex')
            }
        });

        const message: OnboardingMessage = {
            newIdentityPubKey: newIk.publicKey.toString('hex'),
            inviterEphemeralPubKey: '22'.repeat(32),
            ciphertext: '33',
            nonce: '44'.repeat(24),
            signature: signAddDevice(dmk.secretKey, newIk.publicKey).toString('hex')
        };

        server.postOnboardingMessage(
            {
                onboardingMessage: message
            },
            primaryIk.publicKey.toString('hex')
        );

        expect(server.getOnboardingMessage(newIk.publicKey.toString('hex'))).toEqual(message);

        server.confirmOnboarding(newIk.publicKey.toString('hex'));

        expect(() => server.getOnboardingMessage(newIk.publicKey.toString('hex'))).toThrow(
            'Onboarding message'
        );
    });

    it('adds and removes devices with DMK signatures', () => {
        const server = new SyncServer();
        const accountId = '55'.repeat(16);
        const dmk = ed25519_keygen();
        const primaryIk = ed25519_keygen();
        const reconnectIk = ed25519_keygen();

        server.addAccount({
            newAccount: {
                accountId,
                deviceManagementPubKey: dmk.publicKey.toString('hex'),
                identityPubKey: primaryIk.publicKey.toString('hex')
            }
        });

        server.addDeviceToAccount(
            {
                signedDeviceIdentity: {
                    identityPubKey: reconnectIk.publicKey.toString('hex'),
                    signature: signAddDevice(dmk.secretKey, reconnectIk.publicKey).toString('hex')
                }
            },
            primaryIk.publicKey.toString('hex')
        );

        server.removeDeviceFromAccount(
            {
                signedDeviceIdentity: {
                    identityPubKey: reconnectIk.publicKey.toString('hex'),
                    signature: signRevokeDevice(dmk.secretKey, reconnectIk.publicKey).toString(
                        'hex'
                    )
                }
            },
            primaryIk.publicKey.toString('hex')
        );

        expect(() => server.confirmOnboarding(reconnectIk.publicKey.toString('hex'))).toThrow(
            'not found'
        );
    });

    it('rejects device operations signed by identity key instead of DMK', () => {
        const server = new SyncServer();
        const dmk = ed25519_keygen();
        const primaryIk = ed25519_keygen();
        const newIk = ed25519_keygen();

        server.createAccount({
            newAccount: {
                accountId: '66'.repeat(16),
                deviceManagementPubKey: dmk.publicKey.toString('hex'),
                identityPubKey: primaryIk.publicKey.toString('hex')
            }
        });

        expect(() =>
            server.addDeviceToAccount(
                {
                    signedDeviceIdentity: {
                        identityPubKey: newIk.publicKey.toString('hex'),
                        signature: signAddDevice(newIk.secretKey, newIk.publicKey).toString('hex')
                    }
                },
                primaryIk.publicKey.toString('hex')
            )
        ).toThrow('Invalid signature');
    });

    it('saves latest snapshot and returns proof chains', () => {
        const { server, primaryIk } = makeServerWithAccount();
        const [snapshot1, snapshot2, snapshot3] = makeSnapshotChain('01', '02', '03');
        const requesterIk = primaryIk.publicKey.toString('hex');

        server.saveSnapshot({ snapshot: snapshot1 }, requesterIk);
        server.saveSnapshot({ snapshot: snapshot2 }, requesterIk);
        server.saveSnapshot({ snapshot: snapshot3 }, requesterIk);

        expect(
            server.getActualSnapshot(
                {
                    withProofChainTo: snapshot1.snapshotProof
                },
                requesterIk
            )
        ).toEqual({
            snapshot: snapshot3,
            proofChain: {
                proofChain: [ciphertextHash(snapshot2)]
            }
        });

        expect(
            server.getSnapshotProofChain(
                {
                    snapshotProof: snapshot1.snapshotProof
                },
                requesterIk
            )
        ).toEqual({
            proofChain: [ciphertextHash(snapshot2), ciphertextHash(snapshot3)]
        });
    });

    it('rejects snapshots with invalid proof', () => {
        const { server, primaryIk } = makeServerWithAccount();
        const [snapshot1] = makeSnapshotChain('06');
        const requesterIk = primaryIk.publicKey.toString('hex');

        expect(() =>
            server.saveSnapshot(
                {
                    snapshot: {
                        ...snapshot1,
                        snapshotProof: '00'.repeat(32)
                    }
                },
                requesterIk
            )
        ).toThrow('Invalid snapshot proof');
    });

    it('notifies snapshot observers for the matching account only', async () => {
        const server = new SyncServer();
        const accountA = addAccountToServer(server, '77');
        const accountB = addAccountToServer(server, '88');
        const requesterA = accountA.primaryIk.publicKey.toString('hex');
        const requesterB = accountB.primaryIk.publicKey.toString('hex');
        const updatesA: Snapshot[] = [];
        const updatesB: Snapshot[] = [];
        const disconnects: unknown[] = [];
        const [snapshotA1, snapshotA2] = makeSnapshotChain('07', '08');
        const [snapshotB1] = makeSnapshotChain('09');

        const unsubscribeA = await server.subscribeToUpdates(
            update => {
                updatesA.push(snapshotFromEncryptedState(update));
            },
            reason => {
                disconnects.push(reason);
            },
            requesterA
        );
        await server.subscribeToUpdates(
            update => {
                updatesB.push(snapshotFromEncryptedState(update));
            },
            reason => {
                disconnects.push(reason);
            },
            requesterB
        );

        server.saveSnapshot({ snapshot: snapshotA1 }, requesterA);

        expect(updatesA).toEqual([snapshotA1]);
        expect(updatesB).toEqual([]);

        unsubscribeA();
        server.saveSnapshot({ snapshot: snapshotA2 }, requesterA);
        server.saveSnapshot({ snapshot: snapshotB1 }, requesterB);

        expect(updatesA).toEqual([snapshotA1]);
        expect(updatesB).toEqual([snapshotB1]);
        expect(disconnects).toEqual([]);
    });
});

function signAddDevice(dmkSecret: Buffer, ikPub: Buffer): Buffer {
    return ed25519_sign(getServerAddDeviceSignaturePayload(ikPub), dmkSecret);
}

function signRevokeDevice(dmkSecret: Buffer, ikPub: Buffer): Buffer {
    return ed25519_sign(getServerRevokeDeviceSignaturePayload(ikPub), dmkSecret);
}

function makeServerWithAccount() {
    const server = new SyncServer();
    const { primaryIk } = addAccountToServer(server, '77');

    return { server, primaryIk };
}

function addAccountToServer(server: SyncServer, accountSeed: string) {
    const dmk = ed25519_keygen();
    const primaryIk = ed25519_keygen();

    server.createAccount({
        newAccount: {
            accountId: accountSeed.repeat(16),
            deviceManagementPubKey: dmk.publicKey.toString('hex'),
            identityPubKey: primaryIk.publicKey.toString('hex')
        }
    });

    return { dmk, primaryIk };
}

function makeSnapshotChain(...seeds: string[]): Snapshot[] {
    let parentProof = Buffer.from([]);
    return seeds.map(seed => {
        const snapshot = makeSnapshot(seed, parentProof);
        parentProof = Buffer.from(snapshot.snapshotProof, 'hex');
        return snapshot;
    });
}

function makeSnapshot(seed: string, parentProof: Buffer): Snapshot {
    const snapshot = {
        kid: seed.repeat(16),
        ciphertext: seed.repeat(8),
        nonce: seed.repeat(24),
        signature: seed.repeat(64)
    };
    const snapshotProof = getSnapshotProofFromCiphertextHash(
        parentProof,
        Buffer.from(sha256(Buffer.from(snapshot.ciphertext, 'hex')))
    );

    return {
        ...snapshot,
        snapshotProof: snapshotProof.toString('hex')
    };
}

function ciphertextHash(snapshot: Snapshot): string {
    return Buffer.from(sha256(Buffer.from(snapshot.ciphertext, 'hex'))).toString('hex');
}

function snapshotFromEncryptedState(snapshot: {
    kid: Buffer;
    ciphertext: Buffer;
    nonce: Buffer;
    snapshotProof: Buffer;
    signature: Buffer;
}): Snapshot {
    return {
        kid: snapshot.kid.toString('hex'),
        ciphertext: snapshot.ciphertext.toString('hex'),
        nonce: snapshot.nonce.toString('hex'),
        snapshotProof: snapshot.snapshotProof.toString('hex'),
        signature: snapshot.signature.toString('hex')
    };
}
