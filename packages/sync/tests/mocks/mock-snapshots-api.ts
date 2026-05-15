import { sha256 } from '@noble/hashes/sha2.js';

import type { Snapshot, SnapshotProofChain, SnapshotWithProofs } from '../../src/api/generated';
import { Configuration } from '../../src/api/generated';
import type {
    GetActualSnapshotRequest,
    GetSnapshotProofChainRequest,
    SaveSnapshotRequest
} from '../../src/api/generated/apis/SnapshotsApi';
import type { EncryptedState } from '../../src/api/types';

export class MockSnapshotsServer {
    private snapshots: SnapshotRecord[] = [];
    private readonly subscribers = new Map<number, Subscriber>();
    private nextSubscriberId = 0;

    public get snapshotCount(): number {
        return this.snapshots.length;
    }

    public get subscriberCount(): number {
        return this.subscribers.size;
    }

    public hasSnapshot(): boolean {
        return this.snapshots.length > 0;
    }

    public async seedFromSnapshot(snapshot: EncryptedState): Promise<void> {
        this.snapshots = [this.makeRecord(snapshot)];
    }

    public getLatestSnapshotProof(): Buffer {
        if (!this.snapshots.length) {
            throw new Error('No snapshots available');
        }
        return Buffer.from(this.snapshots[this.snapshots.length - 1].encrypted.snapshotProof);
    }

    public async getActualSnapshot(
        requestParameters: GetActualSnapshotRequest = {}
    ): Promise<SnapshotWithProofs> {
        if (!this.snapshots.length) {
            throw new Error('No snapshots available');
        }

        const latest = this.snapshots[this.snapshots.length - 1];
        const proofChainEntries = this.buildProofChain(requestParameters.withProofChainTo, {
            includeLatest: false
        });

        return {
            snapshot: latest.snapshot,
            proofChain: proofChainEntries.length ? { proofChain: proofChainEntries } : undefined
        };
    }

    public async getSnapshotProofChain(
        request: GetSnapshotProofChainRequest
    ): Promise<SnapshotProofChain> {
        return {
            proofChain: this.buildProofChain(request.snapshotProof, { includeLatest: true })
        };
    }

    public async saveSnapshot(request: SaveSnapshotRequest): Promise<void> {
        if (!request.snapshot) {
            throw new Error('Snapshot payload is required');
        }
        await this.pushEncryptedSnapshot(snapshotToEncryptedState(request.snapshot));
    }

    public async pushEncryptedSnapshot(snapshot: EncryptedState, notify = true): Promise<void> {
        const record = this.makeRecord(snapshot);
        this.snapshots.push(record);
        if (notify) {
            await this.notifySubscribers(record.encrypted);
        }
    }

    public subscribe(
        onUpdate: (update: EncryptedState) => void | Promise<void>,
        _onDisconnect?: (reason?: unknown) => void
    ): () => void {
        const id = this.nextSubscriberId++;
        this.subscribers.set(id, { id, onUpdate });
        return () => {
            this.subscribers.delete(id);
        };
    }

    private async notifySubscribers(update: EncryptedState): Promise<void> {
        for (const subscriber of this.subscribers.values()) {
            await subscriber.onUpdate(cloneEncryptedState(update));
        }
    }

    private buildProofChain(
        withProofChainTo?: string,
        opts: { includeLatest: boolean } = { includeLatest: false }
    ): string[] {
        if (this.snapshots.length <= 1) {
            return [];
        }

        const targetProof = withProofChainTo ?? '';
        const startIndex = this.snapshots.findIndex(
            record => record.snapshot.snapshotProof === targetProof
        );
        const fromIndex = startIndex >= 0 ? startIndex : -1;

        const endIndex = opts.includeLatest ? this.snapshots.length : this.snapshots.length - 1;

        const proofChain: string[] = [];
        for (let i = fromIndex + 1; i < endIndex; i++) {
            proofChain.push(this.snapshots[i].ciphertextHash.toString('hex'));
        }
        return proofChain;
    }

    private makeRecord(snapshot: EncryptedState): SnapshotRecord {
        const encrypted = cloneEncryptedState(snapshot);
        return {
            snapshot: encryptedStateToSnapshot(encrypted),
            encrypted,
            ciphertextHash: Buffer.from(sha256(encrypted.ciphertext))
        };
    }
}

export class MockSnapshotsApi {
    public readonly configuration: Configuration;

    constructor(private readonly server: MockSnapshotsServer) {
        this.configuration = new Configuration({ basePath: 'mock://snapshots' });
    }

    public async getActualSnapshot(
        request: GetActualSnapshotRequest = {}
    ): Promise<SnapshotWithProofs> {
        return await this.server.getActualSnapshot(request);
    }

    public async getSnapshotProofChain(
        request: GetSnapshotProofChainRequest
    ): Promise<SnapshotProofChain> {
        return await this.server.getSnapshotProofChain(request);
    }

    public async saveSnapshot(request: SaveSnapshotRequest): Promise<void> {
        await this.server.saveSnapshot(request);
    }
}

export class MockSnapshotsSse {
    constructor(private readonly server: MockSnapshotsServer) {}

    public async subscribeToUpdates(
        onUpdate: (update: EncryptedState) => void | Promise<void>,
        onDisconnect?: (reason?: unknown) => void
    ): Promise<() => void> {
        return this.server.subscribe(onUpdate, onDisconnect);
    }
}

type SnapshotRecord = {
    snapshot: Snapshot;
    encrypted: EncryptedState;
    ciphertextHash: Buffer;
};

type Subscriber = {
    id: number;
    onUpdate: (update: EncryptedState) => void | Promise<void>;
};

function cloneEncryptedState(state: EncryptedState): EncryptedState {
    return {
        kid: Buffer.from(state.kid),
        ciphertext: Buffer.from(state.ciphertext),
        nonce: Buffer.from(state.nonce),
        snapshotProof: Buffer.from(state.snapshotProof),
        signature: Buffer.from(state.signature)
    };
}

function encryptedStateToSnapshot(state: EncryptedState): Snapshot {
    return {
        kid: state.kid.toString('hex'),
        ciphertext: state.ciphertext.toString('hex'),
        nonce: state.nonce.toString('hex'),
        snapshotProof: state.snapshotProof.toString('hex'),
        signature: state.signature.toString('hex')
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
