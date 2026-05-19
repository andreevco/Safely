import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { defineVersionHList, hCons, hNil, projectIdentity } from '@safely/slottree';

import { InMemStorage } from './impl/storage';
import { YCRDTRepository } from '../src/crdt/y-crdt-repository';
import { YManager } from '../src/crdt/y-manager';

const Schema = z
    .object({
        a: z.string(),
        b: z.string()
    })
    .partial();

const Version = {
    version: 1,
    schema: Schema,
    initial: {},
    projectUp: projectIdentity,
    projectDown: projectIdentity
} as const;

const Versions = defineVersionHList(hCons(Version, hNil));

describe('YManager', () => {
    it('leaves in-memory state unchanged when transaction persistence fails', async () => {
        const storage = new FailingSetStorage();
        const manager = await createManager(storage);

        await manager.transaction(draft => {
            draft.set('a', 'before');
        });

        storage.failNextSet = true;

        await expect(
            manager.transaction(draft => {
                draft.set('a', 'after');
            })
        ).rejects.toThrow('persist failed');

        expect(manager.getFull()).toEqual({ a: 'before' });
    });

    it('leaves in-memory state unchanged when update persistence fails', async () => {
        const storage = new FailingSetStorage();
        const manager = await createManager(storage, 'device-1');
        const remote = await createManager(new InMemStorage(), 'device-2');

        await manager.transaction(draft => {
            draft.set('a', 'before');
        });
        await remote.transaction(draft => {
            draft.set('a', 'after');
        });

        storage.failNextSet = true;

        await expect(manager.applyUpdate(remote.encodeAsSnapshot(), 'remote')).rejects.toThrow(
            'persist failed'
        );

        expect(manager.getFull()).toEqual({ a: 'before' });
    });

    it('persists applied updates before publishing them in memory', async () => {
        const storage = new BlockingSetStorage();
        const manager = await createManager(storage, 'device-1');
        const remote = await createManager(new InMemStorage(), 'device-2');

        await remote.transaction(draft => {
            draft.set('a', 'after');
        });

        storage.blockNextSet();

        const applying = manager.applyUpdate(remote.encodeAsSnapshot(), 'remote');

        await storage.waitForBlockedSet();

        expect(manager.getFull()).toEqual({});

        storage.releaseBlockedSet();
        await applying;

        expect(manager.getFull()).toEqual({ a: 'after' });
    });
});

async function createManager(storage: InMemStorage, authorId = 'device') {
    const repository = new YCRDTRepository(storage, Buffer.from(authorId), Versions);
    return await YManager.create(repository);
}

class FailingSetStorage extends InMemStorage {
    public failNextSet = false;

    public override async setItem(key: string, value: string): Promise<void> {
        if (this.failNextSet) {
            this.failNextSet = false;
            throw new Error('persist failed');
        }

        await super.setItem(key, value);
    }
}

class BlockingSetStorage extends InMemStorage {
    public blockedSetCount = 0;
    private shouldBlockNextSet = false;
    private blockedSetSeen: (() => void) | undefined;
    private blockedSetSeenPromise: Promise<void> | undefined;
    private releaseBlockedSetCallback: (() => void) | undefined;

    public blockNextSet(): void {
        this.shouldBlockNextSet = true;
        this.blockedSetSeenPromise = new Promise(resolve => {
            this.blockedSetSeen = resolve;
        });
    }

    public async waitForBlockedSet(): Promise<void> {
        await this.blockedSetSeenPromise;
    }

    public releaseBlockedSet(): void {
        this.releaseBlockedSetCallback?.();
    }

    public override async setItem(key: string, value: string): Promise<void> {
        if (this.shouldBlockNextSet) {
            this.shouldBlockNextSet = false;
            this.blockedSetCount += 1;
            await new Promise<void>(resolve => {
                this.releaseBlockedSetCallback = resolve;
                this.blockedSetSeen?.();
            });
        }

        await super.setItem(key, value);
    }
}
