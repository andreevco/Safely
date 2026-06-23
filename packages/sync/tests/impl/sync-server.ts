import { sha256 } from '@noble/hashes/sha2.js';

import type {
    AddDeviceToAccountRequest,
    CreateAccountRequest,
    GetActualSnapshotRequest,
    GetSnapshotProofChainRequest,
    OnboardingMessage,
    PostOnboardingMessageRequest,
    RemoveDeviceFromAccountRequest,
    SaveSnapshotRequest,
    Snapshot,
    SnapshotProofChain,
    SnapshotWithProofs
} from '../../src/api/generated';
import type { EncryptedState } from '../../src/api/types';
import { ed25519_verify } from '../../src/crypto/ed25519';
import {
    getServerAddDeviceSignaturePayload,
    getServerRevokeDeviceSignaturePayload
} from '../../src/device-manager/device-signature-payload';
import { getSnapshotProofFromCiphertextHash } from '../../src/update-handler/snapshot-proof';

export class SyncServer {
    private readonly accounts: Account[] = [];
    private readonly onboardingMessageSubscribers = new Map<number, OnboardingMessageSubscriber>();
    private nextSubscriberId = 0;

    public createAccount(req: CreateAccountRequest): void {
        if (this.findAccount(req.newAccount.accountId)) {
            throw new Error(`Account with id ${req.newAccount.accountId} already exists`);
        }
        if (this.hasAccountWithIkPub(req.newAccount.identityPubKey)) {
            throw new Error(`Account with ikPub ${req.newAccount.identityPubKey} already exists`);
        }

        this.accounts.push({
            accountId: req.newAccount.accountId,
            dmk: req.newAccount.deviceManagementPubKey,
            devices: [
                {
                    ikPub: req.newAccount.identityPubKey
                }
            ],
            latestSnapshot: null,
            onboardingMessages: [],
            proofChain: [],
            subscribers: new Map()
        });
    }

    public addAccount(req: CreateAccountRequest): void {
        this.createAccount(req);
    }

    public dropSyncData(accountId: string): void {
        const acc = this.findAccount(accountId);
        if (!acc) {
            throw new Error(`Account with id ${accountId} not found`);
        }

        acc.latestSnapshot = null;
        acc.proofChain = [];
    }

    public addDeviceToAccount(req: AddDeviceToAccountRequest, requesterIk: string): void {
        const acc = this.findAccountByIkPub(requesterIk);
        this.verifyAddDeviceSignature(acc, req.signedDeviceIdentity);
        this.addDevice(acc, req.signedDeviceIdentity.identityPubKey);
    }

    public postOnboardingMessage(req: PostOnboardingMessageRequest, requesterIk: string): void {
        const acc = this.findAccountByIkPub(requesterIk);
        this.verifyAddDeviceSignature(acc, {
            identityPubKey: req.onboardingMessage.newIdentityPubKey,
            signature: req.onboardingMessage.signature
        });

        acc.onboardingMessages = acc.onboardingMessages.filter(
            message => message.newIdentityPubKey !== req.onboardingMessage.newIdentityPubKey
        );
        acc.onboardingMessages.push(cloneOnboardingMessage(req.onboardingMessage));
        this.notifyOnboardingMessageSubscribers(req.onboardingMessage.newIdentityPubKey);
    }

    public getOnboardingMessage(requesterIk: string): OnboardingMessage {
        const message = this.accounts
            .flatMap(account => account.onboardingMessages)
            .find(onboardingMessage => onboardingMessage.newIdentityPubKey === requesterIk);

        if (!message) {
            throw new Error(`Onboarding message for ikPub ${requesterIk} not found`);
        }

        return cloneOnboardingMessage(message);
    }

    public async waitForOnboardingMessage(
        requesterIk: string,
        opts: { signal?: AbortSignal; timeoutMs?: number } = {}
    ): Promise<void> {
        if (this.hasOnboardingMessage(requesterIk)) {
            return;
        }

        if (opts.signal?.aborted) {
            throw new Error('Onboarding message wait aborted');
        }

        return await new Promise((resolve, reject) => {
            const subscriberId = this.nextSubscriberId++;
            let timeout: ReturnType<typeof setTimeout> | undefined;

            const cleanup = () => {
                if (timeout) {
                    clearTimeout(timeout);
                }
                opts.signal?.removeEventListener('abort', abort);
                this.onboardingMessageSubscribers.delete(subscriberId);
            };
            const abort = () => {
                cleanup();
                reject(new Error('Onboarding message wait aborted'));
            };

            this.onboardingMessageSubscribers.set(subscriberId, {
                ikPub: requesterIk,
                notify: () => {
                    cleanup();
                    resolve();
                }
            });
            opts.signal?.addEventListener('abort', abort, { once: true });

            if (opts.timeoutMs !== undefined) {
                timeout = setTimeout(() => {
                    cleanup();
                    reject(new Error(`Onboarding message for ikPub ${requesterIk} not found`));
                }, opts.timeoutMs);
            }
        });
    }

    public confirmOnboarding(requesterIk: string): void {
        const acc = this.accounts.find(x =>
            x.onboardingMessages.find(m => m.newIdentityPubKey === requesterIk)
        );
        if (!acc) {
            throw new Error(`Onboarding message for ikPub ${requesterIk} not found`);
        }

        this.addDevice(acc, requesterIk);
        acc.onboardingMessages = acc.onboardingMessages.filter(
            message => message.newIdentityPubKey !== requesterIk
        );
    }

    public removeDeviceFromAccount(req: RemoveDeviceFromAccountRequest, requesterIk: string): void {
        const acc = this.findAccountByIkPub(requesterIk);
        const data = getServerRevokeDeviceSignaturePayload(
            Buffer.from(req.signedDeviceIdentity.identityPubKey, 'hex')
        );
        const verified = ed25519_verify(
            Buffer.from(req.signedDeviceIdentity.signature, 'hex'),
            data,
            Buffer.from(acc.dmk, 'hex')
        );
        if (!verified) {
            throw new Error('Invalid signature');
        }

        this.removeDevice(acc, req.signedDeviceIdentity.identityPubKey);
    }

    public saveSnapshot(req: SaveSnapshotRequest, requesterIk: string): void {
        if (!req.snapshot) {
            throw new Error('Snapshot payload is required');
        }

        const acc = this.findAccountByIkPub(requesterIk);
        const record = this.makeSnapshotRecord(req.snapshot);
        this.verifySnapshotProof(acc, record);

        acc.latestSnapshot = record;
        acc.proofChain.push(record.ciphertextHash);
        this.notifySnapshotSubscribers(acc, record.encrypted);
    }

    public getActualSnapshot(
        req: GetActualSnapshotRequest = {},
        requesterIk: string
    ): SnapshotWithProofs {
        const acc = this.findAccountByIkPub(requesterIk);
        const latest = this.getLatestSnapshotRecord(acc);
        const proofChain = this.buildProofChain(acc, req.withProofChainTo, {
            includeLatest: false
        });

        return {
            snapshot: cloneSnapshot(latest.snapshot),
            proofChain: proofChain.length ? { proofChain } : undefined
        };
    }

    public getSnapshotProofChain(
        req: GetSnapshotProofChainRequest,
        requesterIk: string
    ): SnapshotProofChain {
        const acc = this.findAccountByIkPub(requesterIk);
        return {
            proofChain: this.buildProofChain(acc, req.snapshotProof, {
                includeLatest: true
            })
        };
    }

    public async subscribeToUpdates(
        onUpdate: SnapshotObserver,
        onDisconnect: SnapshotDisconnectObserver | undefined,
        requesterIk: string
    ): Promise<() => void> {
        const acc = this.findAccountByIkPub(requesterIk);
        const id = this.nextSubscriberId++;
        acc.subscribers.set(id, {
            id,
            onUpdate,
            onDisconnect
        });

        return () => {
            acc.subscribers.delete(id);
        };
    }

    private verifyAddDeviceSignature(
        account: Account,
        signedDeviceIdentity: AddDeviceToAccountRequest['signedDeviceIdentity']
    ): void {
        const data = getServerAddDeviceSignaturePayload(
            Buffer.from(signedDeviceIdentity.identityPubKey, 'hex')
        );
        const verified = ed25519_verify(
            Buffer.from(signedDeviceIdentity.signature, 'hex'),
            data,
            Buffer.from(account.dmk, 'hex')
        );
        if (!verified) {
            throw new Error('Invalid signature');
        }
    }

    private addDevice(account: Account, ikPub: string): void {
        if (this.hasAccountWithIkPub(ikPub)) {
            throw new Error(`Device with ikPub ${ikPub} already exists`);
        }

        account.devices.push({
            ikPub
        });
    }

    private removeDevice(account: Account, ikPub: string): void {
        const nextDevices = account.devices.filter(device => device.ikPub !== ikPub);
        if (nextDevices.length === account.devices.length) {
            throw new Error(`Device with ikPub ${ikPub} not found`);
        }
        account.devices = nextDevices;
        account.onboardingMessages = account.onboardingMessages.filter(
            message => message.newIdentityPubKey !== ikPub
        );
    }

    private findAccount(accountId: string): Account | undefined {
        return this.accounts.find(account => account.accountId === accountId);
    }

    private hasAccountWithIkPub(ikPub: string): boolean {
        return (
            this.accounts.find(account =>
                account.devices.find(device => device.ikPub === ikPub)
            ) !== undefined
        );
    }

    private hasOnboardingMessage(requesterIk: string): boolean {
        return this.accounts.some(account =>
            account.onboardingMessages.some(
                onboardingMessage => onboardingMessage.newIdentityPubKey === requesterIk
            )
        );
    }

    private findAccountByIkPub(ikPub: string): Account {
        const acc = this.accounts.find(account =>
            account.devices.find(device => device.ikPub === ikPub)
        );
        if (!acc) {
            throw new Error(`Account with ikPub ${ikPub} not found`);
        }
        return acc;
    }

    private getLatestSnapshotRecord(account: Account): SnapshotRecord {
        const latest = account.latestSnapshot;
        if (!latest) {
            throw new SyncServerError(403002, 'No snapshots available');
        }
        return latest;
    }

    private buildProofChain(
        account: Account,
        withProofChainTo?: string,
        opts: { includeLatest: boolean } = { includeLatest: false }
    ): string[] {
        if (account.proofChain.length <= 1) {
            return [];
        }

        const fromIndex = this.findSnapshotProofIndex(account, withProofChainTo);
        const endIndex = opts.includeLatest
            ? account.proofChain.length
            : account.proofChain.length - 1;

        const proofChain: string[] = [];
        for (let i = fromIndex + 1; i < endIndex; i++) {
            proofChain.push(account.proofChain[i]);
        }
        return proofChain;
    }

    private findSnapshotProofIndex(account: Account, snapshotProof?: string): number {
        if (!snapshotProof) {
            return -1;
        }

        let proof = Buffer.from([]);
        for (let i = 0; i < account.proofChain.length; i++) {
            proof = Buffer.from(
                getSnapshotProofFromCiphertextHash(proof, Buffer.from(account.proofChain[i], 'hex'))
            );
            if (proof.toString('hex') === snapshotProof) {
                return i;
            }
        }
        return -1;
    }

    private makeSnapshotRecord(snapshot: Snapshot): SnapshotRecord {
        const encrypted = snapshotToEncryptedState(snapshot);
        return {
            snapshot: cloneSnapshot(snapshot),
            encrypted,
            ciphertextHash: Buffer.from(sha256(encrypted.ciphertext)).toString('hex')
        };
    }

    private verifySnapshotProof(account: Account, snapshot: SnapshotRecord): void {
        const parentProof = account.latestSnapshot
            ? account.latestSnapshot.encrypted.snapshotProof
            : Buffer.from([]);

        const expectedProof = getSnapshotProofFromCiphertextHash(
            parentProof,
            Buffer.from(snapshot.ciphertextHash, 'hex')
        );
        if (snapshot.snapshot.snapshotProof !== expectedProof.toString('hex')) {
            throw new Error(
                `Invalid snapshot proof: expected ${expectedProof.toString('hex')}, got ${snapshot.snapshot.snapshotProof}`
            );
        }
    }

    private notifySnapshotSubscribers(account: Account, snapshot: EncryptedState): void {
        for (const subscriber of account.subscribers.values()) {
            void Promise.resolve(subscriber.onUpdate(cloneEncryptedState(snapshot))).catch(
                error => {
                    subscriber.onDisconnect?.(error);
                }
            );
        }
    }

    private notifyOnboardingMessageSubscribers(ikPub: string): void {
        for (const subscriber of this.onboardingMessageSubscribers.values()) {
            if (subscriber.ikPub === ikPub) {
                subscriber.notify();
            }
        }
    }
}

class SyncServerError extends Error {
    constructor(
        public readonly code: number,
        message: string
    ) {
        super(message);
    }
}

type Account = {
    accountId: string;
    dmk: string;
    devices: Device[];
    latestSnapshot: SnapshotRecord | null;
    onboardingMessages: OnboardingMessage[];
    proofChain: string[];
    subscribers: Map<number, SnapshotSubscriber>;
};

type Device = {
    ikPub: string;
};

type SnapshotRecord = {
    snapshot: Snapshot;
    encrypted: EncryptedState;
    ciphertextHash: string;
};

type OnboardingMessageSubscriber = {
    ikPub: string;
    notify: () => void;
};

type SnapshotObserver = (update: EncryptedState) => void | Promise<void>;

type SnapshotDisconnectObserver = (reason?: unknown) => void;

type SnapshotSubscriber = {
    id: number;
    onUpdate: SnapshotObserver;
    onDisconnect?: SnapshotDisconnectObserver;
};

function cloneOnboardingMessage(message: OnboardingMessage): OnboardingMessage {
    return {
        newIdentityPubKey: message.newIdentityPubKey,
        inviterEphemeralPubKey: message.inviterEphemeralPubKey,
        ciphertext: message.ciphertext,
        nonce: message.nonce,
        signature: message.signature
    };
}

function cloneSnapshot(snapshot: Snapshot): Snapshot {
    return {
        kid: snapshot.kid,
        ciphertext: snapshot.ciphertext,
        nonce: snapshot.nonce,
        snapshotProof: snapshot.snapshotProof,
        signature: snapshot.signature
    };
}

function cloneEncryptedState(state: EncryptedState): EncryptedState {
    return {
        kid: Buffer.from(state.kid),
        ciphertext: Buffer.from(state.ciphertext),
        nonce: Buffer.from(state.nonce),
        snapshotProof: Buffer.from(state.snapshotProof),
        signature: Buffer.from(state.signature)
    };
}

function snapshotToEncryptedState(snapshot: Snapshot): EncryptedState {
    return {
        kid: Buffer.from(snapshot.kid, 'hex'),
        ciphertext: Buffer.from(snapshot.ciphertext, 'hex'),
        nonce: Buffer.from(snapshot.nonce, 'hex'),
        snapshotProof: Buffer.from(snapshot.snapshotProof, 'hex'),
        signature: Buffer.from(snapshot.signature, 'hex')
    };
}
