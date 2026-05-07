import { beforeEach, describe, expect, it } from 'vitest';
import { z } from 'zod';

import type { StorageImpl } from '../src';
import { createStorage, type Storage } from '../src';
import type { schemaV1, StorageV1 } from './version-fixtures';
import { v1 } from './version-fixtures';
import type { ContainerSlot } from '../src/core/slots';
import { cloneSlot } from '../src/core/slots/slot-json';
import { defineVersionHList, hCons, hNil } from '../src/core/versioning/version';

describe('storage updates', () => {
    let storage: Storage<z.output<typeof schemaV1>>;

    beforeEach(() => {
        storage = createStorage({
            authorId: 'device-1',
            versions: v1
        });
    });

    it('updates values', () => {
        storage.update(draft => {
            draft.key1 = 10;
            draft.key2 = 'value2';
        });

        expect(storage.read().key1).toEqual(10);
        expect(storage.read().key2).toEqual('value2');
    });

    it('notifies observers after successful updates', () => {
        const calls: Array<z.output<typeof schemaV1>> = [];

        storage.onChange(() => {
            calls.push(storage.get());
        });

        storage.update(draft => {
            draft.key1 = 10;
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

        storage.update(draft => {
            draft.key1 = 10;
        });
        remove();
        storage.update(draft => {
            draft.key1 = 20;
        });

        expect(calls).toBe(1);
    });

    it('does not notify observers when an update does not change storage', () => {
        let calls = 0;
        storage.onChange(() => {
            calls += 1;
        });

        storage.update(() => {});

        expect(calls).toBe(0);
    });

    it('reads current values from an update draft', () => {
        storage.update(draft => {
            draft.key1 = 10;
            draft.key2 = 'value';
            draft.key1 = draft.key1 + 5;
            draft.key2 = `${draft.key2}-updated`;
        });

        expect(storage.read().key1).toEqual(15);
        expect(storage.read().key2).toEqual('value-updated');
    });

    it('leaves storage unchanged when update fails schema validation', () => {
        const testStorage = createStorage({
            authorId: 'device-1',
            versions: v1
        });

        testStorage.update(draft => {
            draft.key1 = 10;
        });

        expect(() =>
            testStorage.update(draft => {
                // @ts-expect-error intentional invalid runtime write
                draft.key1 = 'invalid';
            })
        ).toThrow();

        expect(testStorage.read()).toEqual({
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
            storage.update(draft => {
                draft.key1 = 10;
                throw new Error('boom');
            })
        ).toThrow('boom');

        expect(calls).toBe(0);
    });

    it('leaves storage unchanged when update callback throws', () => {
        const testStorage = createStorage({
            authorId: 'device-1',
            versions: v1
        });

        expect(() =>
            testStorage.update(draft => {
                draft.key1 = 10;
                throw new Error('boom');
            })
        ).toThrow('boom');

        expect(testStorage.read()).toEqual({
            key1: 0,
            key2: 'initial'
        });
    });

    it('export returns a deep clone', () => {
        const testStorage = createStorage({
            authorId: 'device-1',
            versions: v1
        }) as StorageImpl<StorageV1>;

        const exported = testStorage.exportSlot() as ContainerSlot;
        const versionSlot = exported.v['1'] as ContainerSlot;
        const key1Slot = versionSlot.v.key1;

        if (key1Slot === undefined || key1Slot.r === true || key1Slot.d === true) {
            throw new Error('Expected key1 to be an atomic slot');
        }

        key1Slot.v = 999;

        expect(testStorage.read()).toEqual({
            key1: 0,
            key2: 'initial'
        });
    });

    it('prevents runtime writes through read proxies', () => {
        const testStorage = createStorage({
            authorId: 'device-1',
            versions: v1
        });

        const readable = testStorage.read();

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
        expect(testStorage.read()).toEqual({
            key1: 0,
            key2: 'initial'
        });
    });

    it('supports object helpers on read proxies', () => {
        const testStorage = createStorage({
            authorId: 'device-1',
            versions: v1
        });

        testStorage.update(draft => {
            draft.key1 = 10;
            draft.key2 = 'updated';
        });

        const readable = testStorage.read();

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

        const testStorage = createStorage({
            authorId: 'device-1',
            versions
        });
        const readable = testStorage.read();

        expect(() => {
            // @ts-expect-error intentional runtime write attempt
            readable.settings.theme = 'dark';
        }).toThrow(TypeError);
        expect(() => {
            // @ts-expect-error intentional runtime delete attempt
            delete readable.settings.theme;
        }).toThrow(TypeError);
        expect(testStorage.read()).toEqual({
            settings: {
                theme: 'light'
            }
        });
    });

    it('returns cloned arrays from read proxies', () => {
        const schema = z.object({
            items: z.array(z.string())
        });

        const versions = defineVersionHList(
            hCons(
                {
                    version: 1,
                    schema,
                    initial: {
                        items: ['one']
                    },
                    projectUp: cloneSlot,
                    projectDown: cloneSlot
                },
                hNil
            )
        );

        const testStorage = createStorage({
            authorId: 'device-1',
            versions
        });

        const items = testStorage.read().items as string[];
        items.push('mutated clone');

        expect(items).toEqual(['one', 'mutated clone']);
        expect(testStorage.read()).toEqual({
            items: ['one']
        });
    });

    it('uses one timestamp for all writes in one transaction', () => {
        const testStorage = createStorage({
            authorId: 'device-1',
            versions: v1
        }) as StorageImpl<StorageV1>;

        testStorage.update(draft => {
            draft.key1 = 10;
            draft.key2 = 'updated';
        });

        const exported = testStorage.exportSlot() as ContainerSlot;
        const versionSlot = exported.v['1'] as ContainerSlot;

        expect(versionSlot.v.key1?.t).toBe(versionSlot.v.key2?.t);
        expect(versionSlot.v.key1?.a).toBe('device-1');
        expect(versionSlot.v.key2?.a).toBe('device-1');
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

        const testStorage = createStorage({
            authorId: 'device-1',
            versions
        });

        testStorage.update(draft => {
            draft.maybe = null;
        });

        expect(testStorage.read()).toEqual({
            maybe: null
        });

        testStorage.update(draft => {
            delete draft.maybe;
        });

        expect(testStorage.read()).toEqual({});
    });
});
