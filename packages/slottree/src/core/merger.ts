import type { SnapshotEncoder } from './encoder/encoder';
import type { MergeStats } from './merge-protocol';
import type { ContainerSlot, Slot } from './slots';
import type { Draft } from './write';

export interface Merger<T> {
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
     * Merge encoded storage.
     */
    merge(incoming: string): MergeStats;

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
     * Export encoded storage.
     */
    export(): string;
}

export interface MergerStorage<T> {
    unsafeAsyncTransactionSlot(
        fn: (draft: Draft<T>) => void,
        commit: (root: ContainerSlot) => Promise<boolean>
    ): Promise<boolean>;

    mergeSlot(incoming: Slot): MergeStats;

    unsafeAsyncMergeSlot(
        incoming: Slot,
        commit: (root: ContainerSlot) => Promise<boolean>
    ): Promise<boolean>;

    exportSlot(): ContainerSlot;
}

export class MergerImpl<T> implements Merger<T> {
    constructor(
        private readonly storage: MergerStorage<T>,
        private readonly encoder: SnapshotEncoder
    ) {}

    public async unsafeAsyncTransaction(
        fn: (draft: Draft<T>) => void,
        commit: (snapshot: string) => Promise<boolean>
    ): Promise<boolean> {
        return await this.storage.unsafeAsyncTransactionSlot(fn, async root => {
            return await commit(this.encoder.encode(root));
        });
    }

    public merge(incoming: string): MergeStats {
        return this.storage.mergeSlot(this.encoder.decode(incoming));
    }

    public async unsafeAsyncMerge(
        incoming: string,
        commit: (snapshot: string) => Promise<boolean>
    ): Promise<boolean> {
        return await this.storage.unsafeAsyncMergeSlot(
            this.encoder.decode(incoming),
            async root => {
                return await commit(this.encoder.encode(root));
            }
        );
    }

    public export(): string {
        return this.encoder.encode(this.storage.exportSlot());
    }
}
