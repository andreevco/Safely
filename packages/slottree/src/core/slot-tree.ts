import type { z } from 'zod';

import type { DeepReadonly } from './json';
import type { MergeStats } from './merge-protocol';
import { MergeProtocol } from './merge-protocol';
import type { ContainerSlot, Slot } from './slots';
import { createOriginContainer, isContainerSlot } from './slots';
import { cloneSlot } from './slots/slot-json';
import { validateSlot } from './slots/slot-validation';
import { StorageObservers } from './storage-observer';
import type { StorageObserver } from './storage-observer';
import type { AssertVersionHList, HCons, NewOf, StorageVersion } from './versioning/version';
import { hListToRuntimeArray } from './versioning/version';
import { VersionController } from './versioning/version-controller';
import { VersionPropagation } from './versioning/version-propagation';
import { WorkingStorageRoot } from './working-storage-root';
import type { Draft } from './write';

export { StorageObservers } from './storage-observer';
export type { StorageObserver } from './storage-observer';

export interface SlotTree<T> {
    readonly version: number;

    /**
     * Returns full storage as JSON representation
     */
    get(): T;

    /**
     * Returns readonly Proxy over storage
     */
    read(): DeepReadonly<T>;

    /**
     * Atomic storage transaction
     * @param fn
     */
    transaction(fn: (draft: Draft<T>) => void): void;

    /**
     * Unsafe atomic async storage transaction.
     * Prepares the next state, passes its encoded snapshot to commit, and only
     * publishes the state in memory when commit resolves to true.
     *
     * Unsafe because concurrent calls can race: each call prepares state from the
     * root visible at its start, then awaits commit before publishing. Callers
     * must serialize calls externally when lost updates are not acceptable.
     */
    unsafeAsyncTransaction(
        fn: (draft: Draft<T>) => void,
        commit: (snapshot: string) => Promise<boolean>
    ): Promise<boolean>;

    /**
     * Merge storage
     * @param incoming
     */
    merge(incoming: string): void;

    /**
     * Unsafe async storage merge.
     * Prepares the merged state, passes its encoded snapshot to commit, and
     * only publishes the state in memory when commit resolves to true.
     *
     * Unsafe because concurrent calls can race: each call prepares state from the
     * root visible at its start, then awaits commit before publishing. Callers
     * must serialize calls externally when lost updates are not acceptable.
     */
    unsafeAsyncMerge(
        incoming: string,
        commit: (snapshot: string) => Promise<boolean>
    ): Promise<boolean>;

    /**
     * Observe successful storage changes.
     * Returns a cleanup function that removes the observer.
     */
    onChange(observer: StorageObserver): () => void;

    /**
     * Export storage to save or send to other device
     */
    export(): string;

    /**
     * Adds new author with selected storage versions and automatically adds migration to the
     * selected storage version
     * @param authorId
     * @param storageVersion
     */
    addAuthor(authorId: string, storageVersion: number): void;

    /**
     * Removes author and deletes version related to the author if there are no other authors
     * using that version
     * @param authorId
     */
    removeAuthor(authorId: string): void;
}

export class StorageImpl<T> implements SlotTree<T> {
    private readonly protocol: MergeProtocol;
    private readonly encoder = new Encoder();
    private root: ContainerSlot;
    private readonly versions: readonly StorageVersion[];
    private readonly observers = new StorageObservers();

    constructor(options: {
        authorId: string;
        versions: readonly StorageVersion[];
        root?: ContainerSlot;
    }) {
        this.protocol = new MergeProtocol(options.authorId);
        this.versions = options.versions;

        if (options.root !== undefined) {
            validateSlot(options.root);
        }

        this.root = options.root === undefined ? createOriginContainer() : cloneSlot(options.root);

        this.ensureLatestInitialized();
        this.syncDeviceVersion();
        this.deleteUnusedVersions();
        this.protocol.observeTree(this.root);
    }

    public addAuthor(authorId: string, storageVersion: number): void {
        const controller = new VersionController(this.root, this.versions);
        controller.setDeviceVersion(
            authorId,
            storageVersion,
            this.protocol.tick(),
            this.protocol.id
        );
        const propagation = new VersionPropagation(this.versions);
        propagation.propagateToOlderVersions(this.root, this.protocol);
        this.observers.notify();
    }

    public removeAuthor(authorId: string): void {
        const controller = new VersionController(this.root, this.versions);
        const deleted = controller.deleteAuthor(authorId);
        if (!deleted) {
            return;
        }

        controller.deleteVersionsUnusedByDevices();
        this.observers.notify();
    }

    public get version(): number {
        return this.latestVersion().version;
    }

    public get(): T {
        return this.committedRoot().get<T>();
    }

    public read(): DeepReadonly<T> {
        return this.committedRoot().read<T>();
    }

    public transaction(fn: (draft: Draft<T>) => void): void {
        const timestamp = this.protocol.tick();
        const author = this.protocol.id;

        const workingRoot = this.createWorkingRoot();

        const updated = workingRoot.update(fn, timestamp, author, this.protocol);
        this.root = workingRoot.result();

        if (updated) {
            this.observers.notify();
        }
    }

    public async unsafeAsyncTransaction(
        fn: (draft: Draft<T>) => void,
        commit: (snapshot: string) => Promise<boolean>
    ): Promise<boolean> {
        const timestamp = this.protocol.tick();
        const author = this.protocol.id;

        const workingRoot = this.createWorkingRoot();

        const updated = workingRoot.update(fn, timestamp, author, this.protocol);
        if (!updated) {
            return false;
        }

        const nextRoot = workingRoot.result();
        const shouldCommit = await commit(this.encoder.encode(nextRoot));
        if (!shouldCommit) {
            return false;
        }

        this.root = nextRoot;
        this.observers.notify();
        return true;
    }

    public merge(incoming: string): MergeStats {
        return this.mergeSlot(this.encoder.decode(incoming));
    }

    public async unsafeAsyncMerge(
        incoming: string,
        commit: (snapshot: string) => Promise<boolean>
    ): Promise<boolean> {
        return await this.unsafeAsyncMergeSlot(this.encoder.decode(incoming), commit);
    }

    public mergeSlot(incoming: Slot): MergeStats {
        const workingRoot = this.createWorkingRoot();
        const validationProtocol = new MergeProtocol(this.protocol.id);
        validationProtocol.observeTree(this.root);
        const stats = workingRoot.merge(validationProtocol, incoming);

        this.root = workingRoot.result();
        this.protocol.observeTree(incoming);
        this.protocol.observeTree(this.root);

        if (didMergeChangeStorage(stats)) {
            this.observers.notify();
        }

        return stats;
    }

    private async unsafeAsyncMergeSlot(
        incoming: Slot,
        commit: (snapshot: string) => Promise<boolean>
    ): Promise<boolean> {
        const workingRoot = this.createWorkingRoot();
        const validationProtocol = new MergeProtocol(this.protocol.id);
        validationProtocol.observeTree(this.root);
        const stats = workingRoot.merge(validationProtocol, incoming);

        if (!didMergeChangeStorage(stats)) {
            return false;
        }

        const nextRoot = workingRoot.result();
        const shouldCommit = await commit(this.encoder.encode(nextRoot));
        if (!shouldCommit) {
            return false;
        }

        this.root = nextRoot;
        this.protocol.observeTree(incoming);
        this.protocol.observeTree(this.root);
        this.observers.notify();
        return true;
    }

    public onChange(observer: StorageObserver): () => void {
        this.observers.add(observer);

        return () => {
            this.observers.remove(observer);
        };
    }

    public export(): string {
        return this.encoder.encode(this.root);
    }

    public exportSlot(): Slot {
        return cloneSlot(this.root);
    }

    private committedRoot(): WorkingStorageRoot {
        return new WorkingStorageRoot(this.root, this.versions);
    }

    private createWorkingRoot(): WorkingStorageRoot {
        return new WorkingStorageRoot(cloneSlot(this.root), this.versions);
    }

    private latestVersion(): StorageVersion {
        const latest = this.versions[this.versions.length - 1];

        if (latest === undefined) {
            throw new Error('Storage must have at least one version');
        }

        return latest;
    }

    private ensureLatestInitialized(): void {
        const latest = this.latestVersion();
        const controller = new VersionController(this.root, this.versions);

        if (controller.get(latest) !== undefined) {
            this.committedRoot().get<T>();
            return;
        }

        for (let index = this.versions.length - 2; index >= 0; index -= 1) {
            const version = this.versions[index];

            if (controller.createVersionFrom(version) !== undefined) {
                this.committedRoot().get<T>();
                return;
            }
        }

        controller.createInitialVersion();
    }

    private syncDeviceVersion(): void {
        const latest = this.latestVersion();
        const controller = new VersionController(this.root, this.versions);

        if (controller.getDeviceVersion(this.protocol.id) === latest.version) {
            return;
        }

        controller.setDeviceVersion(
            this.protocol.id,
            latest.version,
            this.protocol.tick(),
            this.protocol.id
        );
    }

    private deleteUnusedVersions(): void {
        new VersionController(this.root, this.versions).deleteVersionsUnusedByDevices();
    }
}

function didMergeChangeStorage(stats: MergeStats): boolean {
    return stats.added > 0 || stats.updated > 0 || stats.replaced > 0;
}

class Encoder {
    public encode(root: ContainerSlot): string {
        return stableStringify(root);
    }

    public decode(encodedRoot: string): ContainerSlot {
        const root: unknown = JSON.parse(encodedRoot);
        validateSlot(root);

        if (!isContainerSlot(root)) {
            throw new Error('Encoded storage root must be a container slot');
        }

        return root;
    }
}

function stableStringify(value: unknown): string {
    if (value === null || typeof value !== 'object') {
        return JSON.stringify(value);
    }

    if (Array.isArray(value)) {
        return `[${value.map(stableStringify).join(',')}]`;
    }

    const record = value as Record<string, unknown>;
    return `{${Object.keys(record)
        .sort()
        .map(key => `${JSON.stringify(key)}:${stableStringify(record[key])}`)
        .join(',')}}`;
}

export function createStorage<Latest extends StorageVersion, Rest>(options: {
    authorId: string;
    versions: HCons<Latest, Rest> & AssertVersionHList<HCons<Latest, Rest>>;
    root?: ContainerSlot;
}): SlotTree<z.output<NewOf<Latest>>> {
    return new StorageImpl({
        authorId: options.authorId,
        versions: hListToRuntimeArray(options.versions),
        root: options.root
    }) as SlotTree<z.output<NewOf<Latest>>>;
}
