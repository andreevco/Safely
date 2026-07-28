import { beforeEach, describe, expect, it } from 'vitest';
import { z } from 'zod';

import type { StorageImpl } from '../../../src';
import { createStorage, type SlotTree } from '../../../src';
import type { ContainerSlot } from '../../../src/core/slots';
import { isContainerSlot, isTombstoneSlot } from '../../../src/core/slots';
import { cloneSlot } from '../../../src/core/slots/slot-json';
import { defineVersionHList, hCons, hNil } from '../../../src/core/versioning/version';
import { v1 } from '../versioning/version-fixtures';
import type { schemaV1, StorageV1 } from '../versioning/version-fixtures';

describe('storage updates', () => {
    let storage: SlotTree<z.output<typeof schemaV1>>;

    beforeEach(() => {
        storage = createStorage({
            authorId: Buffer.from('device-1'),
            versions: v1
        });
    });

    it('updates values', () => {
        storage.transaction(draft => {
            draft.set('key1', 10);
            draft.set('key2', 'value2');
        });

        expect(storage.read().key1).toEqual(10);
        expect(storage.read().key2).toEqual('value2');
    });

    it('notifies observers after successful updates', () => {
        const calls: Array<z.output<typeof schemaV1>> = [];

        storage.onChange(() => {
            calls.push(storage.get());
        });

        storage.transaction(draft => {
            draft.set('key1', 10);
        });

        expect(calls).toEqual([
            {
                key1: 10,
                key2: 'initial'
            }
        ]);
    });

    it('removes observers through the onChange cleanup function', () => {
        let calls = 0;
        const remove = storage.onChange(() => {
            calls += 1;
        });

        storage.transaction(draft => {
            draft.set('key1', 10);
        });
        remove();
        storage.transaction(draft => {
            draft.set('key1', 20);
        });

        expect(calls).toBe(1);
    });

    it('does not notify observers when an update does not change storage', () => {
        let calls = 0;
        storage.onChange(() => {
            calls += 1;
        });

        storage.transaction(() => {});

        expect(calls).toBe(0);
    });

    it('returns comparable revisions for top-level keys', () => {
        const key1Before = storage.getTopLevelRevision('key1');
        const key2Before = storage.getTopLevelRevision('key2');

        storage.transaction(draft => {
            draft.set('key1', 10);
        });

        const key1After = storage.getTopLevelRevision('key1');
        const key2After = storage.getTopLevelRevision('key2');

        if (
            key1Before === undefined ||
            key1After === undefined ||
            key2Before === undefined ||
            key2After === undefined
        ) {
            throw new Error('Expected existing keys to have revisions');
        }

        expect(key1After.compare(key1Before)).toBeGreaterThan(0);
        expect(key2After.compare(key2Before)).toBe(0);
    });

    it('updates a top-level revision when a nested child changes', () => {
        const schema = z.object({
            profile: z.object({
                meta: z.object({
                    count: z.number()
                })
            }),
            label: z.string()
        });
        const version = defineVersionHList(
            hCons(
                {
                    version: 1,
                    schema,
                    initial: {
                        profile: {
                            meta: {
                                count: 0
                            }
                        },
                        label: 'initial'
                    },
                    projectUp: cloneSlot,
                    projectDown: cloneSlot
                },
                hNil
            )
        );
        const nestedStorage = createStorage({
            authorId: Buffer.from('device-1'),
            versions: version
        });
        const profileBefore = nestedStorage.getTopLevelRevision('profile');
        const labelBefore = nestedStorage.getTopLevelRevision('label');

        nestedStorage.transaction(draft => {
            draft.at('profile').at('meta').set('count', 1);
        });

        const profileAfter = nestedStorage.getTopLevelRevision('profile');
        const labelAfter = nestedStorage.getTopLevelRevision('label');

        if (
            profileBefore === undefined ||
            profileAfter === undefined ||
            labelBefore === undefined ||
            labelAfter === undefined
        ) {
            throw new Error('Expected existing keys to have revisions');
        }

        expect(profileAfter.compare(profileBefore)).toBeGreaterThan(0);
        expect(labelAfter.compare(labelBefore)).toBe(0);
    });

    it('reads current values from an update draft', () => {
        storage.transaction(draft => {
            draft.set('key1', 10);
            draft.set('key2', 'value');
            draft.set('key1', (draft.at('key1').get() ?? 0) + 5);
            draft.set('key2', `${draft.at('key2').get()}-updated`);
        });

        expect(storage.read().key1).toEqual(15);
        expect(storage.read().key2).toEqual('value-updated');
    });

    describe('async transactions', () => {
        it('commits async transactions only after commit hook resolves true', async () => {
            const snapshots: Buffer[] = [];
            let calls = 0;
            storage.onChange(() => {
                calls += 1;
            });

            const committed = await storage.unsafeAsyncTransaction(
                draft => {
                    draft.set('key1', 10);
                },
                async snapshot => {
                    snapshots.push(snapshot);
                    expect(storage.read()).toEqual({
                        key1: 0,
                        key2: 'initial'
                    });
                    return true;
                }
            );

            expect(committed).toBe(true);
            expect(snapshots).toHaveLength(1);
            expect(storage.read()).toEqual({
                key1: 10,
                key2: 'initial'
            });
            expect(calls).toBe(1);
        });

        it('leaves async transaction state unpublished when commit hook resolves false', async () => {
            let calls = 0;
            storage.onChange(() => {
                calls += 1;
            });

            const committed = await storage.unsafeAsyncTransaction(
                draft => {
                    draft.set('key1', 10);
                },
                async () => false
            );

            expect(committed).toBe(false);
            expect(storage.read()).toEqual({
                key1: 0,
                key2: 'initial'
            });
            expect(calls).toBe(0);
        });

        it('leaves async transaction state unpublished when commit hook rejects', async () => {
            let calls = 0;
            storage.onChange(() => {
                calls += 1;
            });

            await expect(
                storage.unsafeAsyncTransaction(
                    draft => {
                        draft.set('key1', 10);
                    },
                    async () => {
                        throw new Error('persist failed');
                    }
                )
            ).rejects.toThrow('persist failed');

            expect(storage.read()).toEqual({
                key1: 0,
                key2: 'initial'
            });
            expect(calls).toBe(0);
        });

        it('commits unsafe async merges only after commit hook resolves true', async () => {
            const remote = createStorage({
                authorId: Buffer.from('device-2'),
                versions: v1
            });
            remote.transaction(draft => {
                draft.set('key1', 10);
            });

            let calls = 0;
            storage.onChange(() => {
                calls += 1;
            });

            const committed = await storage.unsafeAsyncMerge(remote.export(), async () => {
                expect(storage.read()).toEqual({
                    key1: 0,
                    key2: 'initial'
                });
                return true;
            });

            expect(committed).toBe(true);
            expect(storage.read()).toEqual({
                key1: 10,
                key2: 'initial'
            });
            expect(calls).toBe(1);
        });

        it('leaves unsafe async merge state unpublished when commit hook resolves false', async () => {
            const remote = createStorage({
                authorId: Buffer.from('device-2'),
                versions: v1
            });
            remote.transaction(draft => {
                draft.set('key1', 10);
            });

            let calls = 0;
            storage.onChange(() => {
                calls += 1;
            });

            const committed = await storage.unsafeAsyncMerge(remote.export(), async () => {
                return false;
            });
            expect(committed).toBe(false);
            expect(storage.read()).toEqual({
                key1: 0,
                key2: 'initial'
            });
            expect(calls).toBe(0);
        });

        it('leaves unsafe async merge state unpublished when commit hook rejects', async () => {
            const remote = createStorage({
                authorId: Buffer.from('device-2'),
                versions: v1
            });
            remote.transaction(draft => {
                draft.set('key1', 10);
            });

            let calls = 0;
            storage.onChange(() => {
                calls += 1;
            });

            await expect(
                storage.unsafeAsyncMerge(remote.export(), async () => {
                    throw new Error('persist failed');
                })
            ).rejects.toThrow('persist failed');

            expect(storage.read()).toEqual({
                key1: 0,
                key2: 'initial'
            });
            expect(calls).toBe(0);
        });
    });

    it('leaves storage unchanged when update fails schema validation', () => {
        const isolatedStorage = createStorage({
            authorId: Buffer.from('device-1'),
            versions: v1
        });

        isolatedStorage.transaction(draft => {
            draft.set('key1', 10);
        });

        expect(() =>
            isolatedStorage.transaction(draft => {
                // @ts-expect-error intentional invalid runtime write
                draft.set('key1', 'invalid');
            })
        ).toThrow();

        expect(isolatedStorage.read()).toEqual({
            key1: 10,
            key2: 'initial'
        });
    });

    it('does not notify observers when update fails', () => {
        let calls = 0;
        storage.onChange(() => {
            calls += 1;
        });

        expect(() =>
            storage.transaction(draft => {
                draft.set('key1', 10);
                throw new Error('boom');
            })
        ).toThrow('boom');

        expect(calls).toBe(0);
    });

    it('leaves storage unchanged when update callback throws', () => {
        const isolatedStorage = createStorage({
            authorId: Buffer.from('device-1'),
            versions: v1
        });

        expect(() =>
            isolatedStorage.transaction(draft => {
                draft.set('key1', 10);
                throw new Error('boom');
            })
        ).toThrow('boom');

        expect(isolatedStorage.read()).toEqual({
            key1: 0,
            key2: 'initial'
        });
    });

    it('export returns a deep clone', () => {
        const isolatedStorage = createStorage({
            authorId: Buffer.from('device-1'),
            versions: v1
        }) as StorageImpl<StorageV1>;

        const exported = isolatedStorage.exportSlot();
        const versionSlot = exported.v['1'] as ContainerSlot;
        const key1Slot = versionSlot.v.key1;

        if (key1Slot === undefined || isContainerSlot(key1Slot) || isTombstoneSlot(key1Slot)) {
            throw new Error('Expected key1 to be an atomic slot');
        }

        key1Slot.v = 999;

        expect(isolatedStorage.read()).toEqual({
            key1: 0,
            key2: 'initial'
        });
    });

    it('exports a stable snapshot independent of object key insertion order', () => {
        const isolatedStorage = createStorage({
            authorId: Buffer.from('device-1'),
            versions: v1
        }) as StorageImpl<StorageV1>;

        isolatedStorage.transaction(draft => {
            draft.set('key1', 10);
            draft.set('key2', 'updated');
        });

        const reordered = reverseSlotKeys(isolatedStorage.exportSlot());
        const storageFromReorderedRoot = createStorage({
            authorId: Buffer.from('device-1'),
            versions: v1,
            root: reordered
        });

        expect(storageFromReorderedRoot.export().equals(isolatedStorage.export())).toBe(true);
    });

    it('prevents runtime writes through read proxies', () => {
        const isolatedStorage = createStorage({
            authorId: Buffer.from('device-1'),
            versions: v1
        });

        const readable = isolatedStorage.read();

        expect(() => {
            // @ts-expect-error intentional runtime write attempt
            readable.key1 = 999;
        }).toThrow(TypeError);
        expect(() => {
            // @ts-expect-error intentional runtime delete attempt
            delete readable.key2;
        }).toThrow(TypeError);
        expect(() =>
            Object.defineProperty(readable, 'key1', {
                value: 999
            })
        ).toThrow(TypeError);
        expect(() => {
            Object.setPrototypeOf(readable, {});
        }).toThrow(TypeError);
        expect(isolatedStorage.read()).toEqual({
            key1: 0,
            key2: 'initial'
        });
    });

    it('supports object helpers on read proxies', () => {
        const isolatedStorage = createStorage({
            authorId: Buffer.from('device-1'),
            versions: v1
        });

        isolatedStorage.transaction(draft => {
            draft.set('key1', 10);
            draft.set('key2', 'updated');
        });

        const readable = isolatedStorage.read();

        expect(Object.keys(readable)).toEqual(['key1', 'key2']);
        expect('key1' in readable).toBe(true);
        expect('missing' in readable).toBe(false);
        expect({ ...readable }).toEqual({
            key1: 10,
            key2: 'updated'
        });
        expect(JSON.stringify(readable)).toBe(
            JSON.stringify({
                key1: 10,
                key2: 'updated'
            })
        );
        expect(Object.getOwnPropertyDescriptor(readable, 'key1')).toMatchObject({
            configurable: true,
            enumerable: true,
            writable: false,
            value: 10
        });
    });

    it('prevents runtime writes through nested read proxies', () => {
        const schema = z.object({
            settings: z.object({
                theme: z.string()
            })
        });

        const versions = defineVersionHList(
            hCons(
                {
                    version: 1,
                    schema,
                    initial: {
                        settings: {
                            theme: 'light'
                        }
                    },
                    projectUp: cloneSlot,
                    projectDown: cloneSlot
                },
                hNil
            )
        );

        const isolatedStorage = createStorage({
            authorId: Buffer.from('device-1'),
            versions
        });
        const readable = isolatedStorage.read();

        expect(() => {
            // @ts-expect-error intentional runtime write attempt
            readable.settings.theme = 'dark';
        }).toThrow(TypeError);
        expect(() => {
            // @ts-expect-error intentional runtime delete attempt
            delete readable.settings.theme;
        }).toThrow(TypeError);
        expect(isolatedStorage.read()).toEqual({
            settings: {
                theme: 'light'
            }
        });
    });

    it('returns cloned arrays from read proxies', () => {
        const schema = z.object({
            items: z.array(
                z.object({
                    __setId: z.string(),
                    value: z.string()
                })
            )
        });

        const versions = defineVersionHList(
            hCons(
                {
                    version: 1,
                    schema,
                    initial: {
                        items: [{ __setId: 'one', value: 'one' }]
                    },
                    projectUp: cloneSlot,
                    projectDown: cloneSlot
                },
                hNil
            )
        );

        const isolatedStorage = createStorage({
            authorId: Buffer.from('device-1'),
            versions
        });

        const items = isolatedStorage.read().items as Array<{ __setId: string; value: string }>;
        items.push({ __setId: 'mutated', value: 'mutated clone' });

        expect(items).toEqual([
            { __setId: 'one', value: 'one' },
            { __setId: 'mutated', value: 'mutated clone' }
        ]);
        expect(isolatedStorage.read()).toEqual({
            items: [{ __setId: 'one', value: 'one' }]
        });
    });

    it('uses one timestamp for all writes in one transaction', () => {
        const isolatedStorage = createStorage({
            authorId: Buffer.from('device-1'),
            versions: v1
        }) as StorageImpl<StorageV1>;

        isolatedStorage.transaction(draft => {
            draft.set('key1', 10);
            draft.set('key2', 'updated');
        });

        const exported = isolatedStorage.exportSlot();
        const versionSlot = exported.v['1'] as ContainerSlot;
        const author = Buffer.from('device-1').toString('hex');

        expect(versionSlot.v.key1?.t).toBe(versionSlot.v.key2?.t);
        expect(versionSlot.v.key1?.a).toBe(author);
        expect(versionSlot.v.key2?.a).toBe(author);
    });

    it('distinguishes null values from deleted fields', () => {
        const schema = z.object({
            maybe: z.string().nullable().optional()
        });

        const versions = defineVersionHList(
            hCons(
                {
                    version: 1,
                    schema,
                    initial: {
                        maybe: 'initial'
                    },
                    projectUp: cloneSlot,
                    projectDown: cloneSlot
                },
                hNil
            )
        );

        const isolatedStorage = createStorage({
            authorId: Buffer.from('device-1'),
            versions
        });

        isolatedStorage.transaction(draft => {
            draft.set('maybe', null);
        });

        expect(isolatedStorage.read()).toEqual({
            maybe: null
        });

        isolatedStorage.transaction(draft => {
            draft.delete('maybe');
        });

        expect(isolatedStorage.read()).toEqual({});
    });
});

function reverseSlotKeys(slot: ContainerSlot): ContainerSlot {
    const reversed = {
        ...slot,
        v: Object.fromEntries(
            Object.entries(slot.v)
                .reverse()
                .map(([key, value]) => [
                    key,
                    isContainerSlot(value) ? reverseSlotKeys(value) : value
                ])
        )
    };

    return reversed as ContainerSlot;
}
