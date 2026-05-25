import { beforeEach, describe, expect, it } from 'vitest';
import type { z } from 'zod';

import type { StorageImpl } from '../src';
import { createStorage } from '../src';
import type { schemaV1 } from './version-fixtures';
import { v1 } from './version-fixtures';
import { createOriginContainer } from '../src/core/slots';
import { slotFromJson } from '../src/core/slots/slot-json';

describe('storage merge', () => {
    let storage1: StorageImpl<z.output<typeof schemaV1>>;
    let storage2: StorageImpl<z.output<typeof schemaV1>>;

    beforeEach(() => {
        storage1 = createStorage({
            authorId: 'device-1',
            versions: v1
        }) as StorageImpl<z.output<typeof schemaV1>>;
        storage2 = createStorage({
            authorId: 'device-2',
            versions: v1
        }) as StorageImpl<z.output<typeof schemaV1>>;
    });

    it('merges values', () => {
        storage1.transaction(draft => {
            draft.set('key1', 10);
        });
        storage2.transaction(draft => {
            draft.set('key2', 'value2');
        });

        storage1.merge(storage2.export());
        expect(storage1.read().key1).toEqual(10);
        expect(storage1.read().key2).toEqual('value2');

        storage2.merge(storage1.export());
        expect(storage2.read().key1).toEqual(10);
        expect(storage2.read().key2).toEqual('value2');
    });

    it('notifies observers after successful merges that change storage', () => {
        let calls = 0;
        storage1.onChange(() => {
            calls += 1;
        });

        storage2.transaction(draft => {
            draft.set('key2', 'value2');
        });

        storage1.merge(storage2.export());

        expect(calls).toBe(1);
    });

    it('does not notify observers after no-op merges', () => {
        let calls = 0;
        storage1.onChange(() => {
            calls += 1;
        });

        storage1.merge(storage1.export());

        expect(calls).toBe(0);
    });

    it('leaves storage unchanged when an incoming merge fails validation', () => {
        const incoming = createOriginContainer({
            '1': slotFromJson({ key1: 'invalid', key2: 'value2' }, 2_000_000_000, 'remote')
        });

        expect(() => storage1.mergeSlot(incoming)).toThrow();
        expect(storage1.read()).toEqual({ key1: 0, key2: 'initial' });

        storage1.transaction(draft => {
            draft.set('key1', 1);
        });
        const exported = storage1.exportSlot();
        const versionSlot = exported.v['1'] as unknown as {
            v: { key1: { t: number } };
        };
        expect(versionSlot.v.key1.t).toBeLessThan(2_000_000_000);
    });

    it('does not notify observers when merge fails', () => {
        const incoming = createOriginContainer({
            '1': slotFromJson({ key1: 'invalid', key2: 'value2' }, 2_000_000_000, 'remote')
        });
        let calls = 0;
        storage1.onChange(() => {
            calls += 1;
        });

        expect(() => storage1.mergeSlot(incoming)).toThrow();

        expect(calls).toBe(0);
    });
});
