import { describe, expect, it } from 'vitest';
import * as Y from 'yjs';
import { z } from 'zod';

import { zArrayWithKey } from '../src';
import { TransactionError } from '../src/crdt/atomic-transaction';
import { yValueToJs } from '../src/crdt/deep-merge/y-value-to-js';
import { chainToRuntimeArray, defineStorageVersion, defineVersionChain } from '../src/crdt/version';
import { YCRDT } from '../src/crdt/y-crdt';

const schemaV1 = {
    name: z.string(),
    age: z.number()
};

const schemaV2 = {
    fullName: z.string(),
    age: z.number(),
    tags: zArrayWithKey(z.string(), value => value)
};

const schemaV3 = {
    profile: z.object({
        displayName: z.string(),
        age: z.number()
    }),
    tags: zArrayWithKey(z.string(), value => value),
    revision: z.number()
};

const schemaV4 = {
    profile: z.object({
        displayName: z.string(),
        age: z.number()
    }),
    tags: zArrayWithKey(z.string(), value => value),
    revision: z.number(),
    active: z.boolean()
};

const v1 = defineStorageVersion<{}, typeof schemaV1>({
    version: 1,
    schema: {
        name: z.string(),
        age: z.number()
    },
    migrate: _ => ({
        name: '',
        age: 0
    }),
    reverseMigrate: _ => ({})
});

const v2 = defineStorageVersion<typeof schemaV1, typeof schemaV2>({
    version: 2,
    schema: {
        fullName: z.string(),
        age: z.number(),
        tags: zArrayWithKey(z.string(), value => value)
    },
    migrate: old => ({
        fullName: old.name,
        age: old.age,
        tags: []
    }),
    reverseMigrate: current => ({
        name: current.fullName,
        age: current.age
    })
});

const v3 = defineStorageVersion<typeof schemaV2, typeof schemaV3>({
    version: 3,
    schema: {
        profile: z.object({
            displayName: z.string(),
            age: z.number()
        }),
        tags: zArrayWithKey(z.string(), value => value),
        revision: z.number()
    },
    migrate: old => ({
        profile: {
            displayName: old.fullName,
            age: old.age
        },
        tags: old.tags,
        revision: 0
    }),
    reverseMigrate: current => ({
        fullName: current.profile.displayName,
        age: current.profile.age,
        tags: current.tags
    })
});

const v4 = defineStorageVersion<typeof schemaV3, typeof schemaV4>({
    version: 4,
    schema: {
        profile: z.object({
            displayName: z.string(),
            age: z.number()
        }),
        tags: zArrayWithKey(z.string(), value => value),
        revision: z.number(),
        active: z.boolean()
    },
    migrate: old => ({
        profile: old.profile,
        tags: old.tags,
        revision: old.revision,
        active: true
    }),
    reverseMigrate: current => ({
        profile: current.profile,
        tags: current.tags,
        revision: current.revision
    })
});

const versionsV1 = chainToRuntimeArray(defineVersionChain(v1));
const versionsV1V2 = chainToRuntimeArray(defineVersionChain(v1, v2));
const versionsV1V2V3 = chainToRuntimeArray(defineVersionChain(v1, v2, v3));
const versionsV1V2V3V4 = chainToRuntimeArray(defineVersionChain(v1, v2, v3, v4));

describe('crdt versions migrations', () => {
    it('migrates forward from v1 to v4 on startup', () => {
        const legacy = YCRDT.create(new Y.Doc(), versionsV1);
        legacy.set('name', 'Alice');
        legacy.set('age', 31);

        const latest = YCRDT.create(fromSnapshot(legacy.encodeAsSnapshot()), versionsV1V2V3V4);

        expect(latest.get('profile')).toEqual({ displayName: 'Alice', age: 31 });
        expect(latest.get('tags')).toEqual([]);
        expect(latest.get('revision')).toBe(0);
        expect(latest.get('active')).toBe(true);
    });

    it('migrates update forward when remote device is on older version', () => {
        const oldDevice = YCRDT.create(new Y.Doc(), versionsV1);
        const latestDevice = YCRDT.create(new Y.Doc(), versionsV1V2V3V4);

        oldDevice.set('name', 'Bob');
        oldDevice.set('age', 44);

        latestDevice.applyUpdate(oldDevice.encodeAsSnapshot(), 'remote-v1', 1);

        expect(latestDevice.get('profile')).toEqual({ displayName: 'Bob', age: 44 });
        expect(latestDevice.get('tags')).toEqual([]);
        expect(latestDevice.get('revision')).toBe(0);
        expect(latestDevice.get('active')).toBe(true);
    });

    it('migrates from v3 to v4 on different devices and merges', () => {
        // Create two devices on v3 and SYNC them
        const v3Device_1 = YCRDT.create(new Y.Doc(), versionsV1V2V3);
        const v3Device_2 = YCRDT.create(new Y.Doc(), versionsV1V2V3);
        v3Device_2.applyUpdate(v3Device_1.encodeAsSnapshot(), 'remote', 3);
        v3Device_1.applyUpdate(v3Device_2.encodeAsSnapshot(), 'remote', 3);

        // Update on device 1, then sync on device 2
        v3Device_1.set('profile', { displayName: 'Bob', age: 44 });
        v3Device_2.applyUpdate(v3Device_1.encodeAsSnapshot(), 'remote', 3);
        expect(v3Device_2.get('profile')).toEqual({ displayName: 'Bob', age: 44 });

        // Migrate both to v4 and DO NOT SYNC yet
        const latestDevice_1 = YCRDT.create(
            fromSnapshot(v3Device_1.encodeAsSnapshot()),
            versionsV1V2V3V4
        );
        const latestDevice_2 = YCRDT.create(
            fromSnapshot(v3Device_2.encodeAsSnapshot()),
            versionsV1V2V3V4
        );

        // Update on device 1, then sync on device 2
        latestDevice_1.set('profile', { displayName: 'Alice', age: 45 });
        latestDevice_2.applyUpdate(latestDevice_1.encodeAsSnapshot(), 'remote', 4);
        expect(latestDevice_2.get('profile')).toEqual({ displayName: 'Alice', age: 45 });
    });

    it('reverse-migrates data so a v1 device can consume v4 updates', () => {
        const oldDevice = YCRDT.create(new Y.Doc(), versionsV1);
        const latestDevice = YCRDT.create(new Y.Doc(), versionsV1V2V3V4);

        latestDevice.set('profile', { displayName: 'Charlie', age: 28 });
        latestDevice.set('tags', ['x', 'y']);
        latestDevice.set('revision', 7);
        latestDevice.set('active', false);

        oldDevice.applyUpdate(latestDevice.encodeAsSnapshot(), 'remote-v4', 4);

        expect(oldDevice.get('name')).toBe('Charlie');
        expect(oldDevice.get('age')).toBe(28);
    });

    it('keeps intermediate maps in sync on reverse migration', () => {
        const latestDevice = YCRDT.create(new Y.Doc(), versionsV1V2V3V4);

        const v2Device = YCRDT.create(new Y.Doc(), versionsV1V2);
        v2Device.set('fullName', 'Legacy v2');
        v2Device.set('age', 50);
        v2Device.set('tags', ['a']);
        latestDevice.applyUpdate(v2Device.encodeAsSnapshot(), 'remote-v2', 2);

        const v3Device = YCRDT.create(new Y.Doc(), versionsV1V2V3);
        v3Device.set('profile', { displayName: 'Legacy v3', age: 51 });
        v3Device.set('tags', ['b']);
        v3Device.set('revision', 3);
        latestDevice.applyUpdate(v3Device.encodeAsSnapshot(), 'remote-v3', 3);

        latestDevice.set('profile', { displayName: 'Newest', age: 52 });
        latestDevice.set('tags', ['x']);
        latestDevice.set('revision', 99);
        latestDevice.set('active', true);

        expect(readVersionState(latestDevice.toRaw(), v3.version, v3.schema)).toEqual({
            profile: { displayName: 'Newest', age: 52 },
            tags: ['x'],
            revision: 99
        });
        expect(readVersionState(latestDevice.toRaw(), v2.version, v2.schema)).toEqual({
            fullName: 'Newest',
            age: 52,
            tags: ['x']
        });
        expect(readVersionState(latestDevice.toRaw(), v1.version, v1.schema)).toEqual({
            name: 'Newest',
            age: 52
        });
    });

    it('supports bidirectional sync between devices on v1 and v4', () => {
        const oldDevice = YCRDT.create(new Y.Doc(), versionsV1);
        const latestDevice = YCRDT.create(new Y.Doc(), versionsV1V2V3V4);

        oldDevice.set('name', 'First');
        oldDevice.set('age', 18);
        latestDevice.applyUpdate(oldDevice.encodeAsSnapshot(), 'old->new', 1);

        latestDevice.set('profile', { displayName: 'Second', age: 19 });
        latestDevice.set('tags', ['sync']);
        latestDevice.set('revision', 10);
        latestDevice.set('active', false);
        oldDevice.applyUpdate(latestDevice.encodeAsSnapshot(), 'new->old', 4);

        oldDevice.set('name', 'Third');
        oldDevice.set('age', 20);
        latestDevice.applyUpdate(oldDevice.encodeAsSnapshot(), 'old->new-again', 1);
        oldDevice.applyUpdate(latestDevice.encodeAsSnapshot(), 'new->old-again', 4);

        expect(latestDevice.get('profile')).toEqual({ displayName: 'Third', age: 20 });
        expect(latestDevice.get('tags')).toEqual([]);
        expect(latestDevice.get('revision')).toBe(0);
        expect(latestDevice.get('active')).toBe(true);
        expect(oldDevice.get('name')).toBe('Third');
        expect(oldDevice.get('age')).toBe(20);
    });

    it('throws for unknown remoteStorageVersion and does not mutate document', () => {
        const oldDevice = YCRDT.create(new Y.Doc(), versionsV1);
        const latestDevice = YCRDT.create(new Y.Doc(), versionsV1V2V3V4);

        oldDevice.set('name', 'David');
        oldDevice.set('age', 60);

        const before = latestDevice.encodeAsSnapshot();
        expect(() =>
            latestDevice.applyUpdate(oldDevice.encodeAsSnapshot(), 'bad-version', 0)
        ).toThrow(TransactionError);
        expect(latestDevice.encodeAsSnapshot().equals(before)).toBe(true);
    });
});

function fromSnapshot(snapshot: Buffer): Y.Doc {
    const doc = new Y.Doc();
    Y.applyUpdateV2(doc, snapshot);
    return doc;
}

function readVersionState(
    doc: Y.Doc,
    version: number,
    schema: Record<string, z.ZodTypeAny>
): Record<string, unknown> {
    const root = doc.getMap('root');
    const raw = root.get(version.toString());

    if (!(raw instanceof Y.Map)) {
        throw new Error(`Version map ${version} is missing`);
    }

    const state: Record<string, unknown> = {};
    for (const [key, value] of raw.entries()) {
        state[key] = yValueToJs(value, schema[key]);
    }
    return state;
}
