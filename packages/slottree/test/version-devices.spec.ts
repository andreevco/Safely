import { afterEach, describe, expect, it, vi } from 'vitest';
import { z } from 'zod';

import type { StorageImpl } from '../src';
import {
    createStorage,
    DEVICES_KEY,
    defineVersionHList,
    hCons,
    hNil,
    projectIdentity,
    VERSION_DELETION_GRACE_PERIOD_SECONDS,
    VERSION_DELETION_KEY
} from '../src';
import type { StorageV3 } from './version-fixtures';
import { v1, v3 } from './version-fixtures';
import { createOriginContainer } from '../src/core/slots';
import { slotFromJson, stripSlot } from '../src/core/slots/slot-json';

const v3Initial = {
    key1: 0,
    label: 'initial',
    key3: false,
    key4: 'v3'
};

const device1 = Buffer.from('device-1').toString('hex');
const deviceV1 = Buffer.from('device-v1').toString('hex');
const oldDevice = Buffer.from('old-device').toString('hex');

describe('storage device versions', () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it('records the current device schema version when storage is created', () => {
        const storage = createStorage({
            authorId: Buffer.from('device-1'),
            versions: v3
        }) as StorageImpl<StorageV3>;

        const exported = storage.exportSlot();

        expect(stripSlot(exported.v[DEVICES_KEY])).toEqual({
            [device1]: {
                version: 3
            }
        });
    });

    it('updates the current device version when it differs from the latest schema version', () => {
        const root = createOriginContainer({
            '3': slotFromJson(v3Initial, 0, ''),
            [DEVICES_KEY]: slotFromJson(
                {
                    [device1]: { version: 1 },
                    'old-device': { version: 1 }
                },
                0,
                ''
            )
        });

        const storage = createStorage({
            authorId: Buffer.from('device-1'),
            versions: v3,
            root
        }) as StorageImpl<StorageV3>;

        const exported = storage.exportSlot();

        expect(stripSlot(exported.v[DEVICES_KEY])).toEqual({
            [device1]: {
                version: 3
            },
            'old-device': {
                version: 1
            }
        });
    });

    it('marks schema versions that are not used by any device for deletion', () => {
        const now = Math.floor(new Date('2026-01-01T00:00:00.000Z').getTime() / 1000);
        vi.setSystemTime(new Date(now * 1000));
        const root = createOriginContainer({
            '1': slotFromJson({ key1: 10, key2: 'legacy' }, 0, ''),
            '3': slotFromJson(v3Initial, 0, ''),
            [DEVICES_KEY]: slotFromJson(
                {
                    [device1]: { version: 3 }
                },
                0,
                ''
            )
        });

        const storage = createStorage({
            authorId: Buffer.from('device-1'),
            versions: v3,
            root
        }) as StorageImpl<StorageV3>;

        const exported = storage.exportSlot();

        expect(exported.v['1']).toBeDefined();
        expect(exported.v['3']).toBeDefined();
        expect(stripSlot(exported.v[VERSION_DELETION_KEY])).toEqual({
            '1': {
                shouldBeDeletedAt: now + VERSION_DELETION_GRACE_PERIOD_SECONDS
            }
        });
    });

    it('keeps schema versions that are still used by another device', () => {
        const root = createOriginContainer({
            '1': slotFromJson({ key1: 10, key2: 'legacy' }, 0, ''),
            '3': slotFromJson(v3Initial, 0, ''),
            [DEVICES_KEY]: slotFromJson(
                {
                    [device1]: { version: 3 },
                    'old-device': { version: 1 }
                },
                0,
                ''
            )
        });

        const storage = createStorage({
            authorId: Buffer.from('device-1'),
            versions: v3,
            root
        }) as StorageImpl<StorageV3>;

        const exported = storage.exportSlot();

        expect(exported.v['1']).toBeDefined();
        expect(exported.v['3']).toBeDefined();
    });

    it('keeps storage versions newer than the latest known version when loading a snapshot', () => {
        const root = createOriginContainer({
            '1': slotFromJson({ key1: 10, key2: 'known' }, 0, ''),
            '2': slotFromJson({ key1: 20, key2: 'future-v2', key3: true }, 0, ''),
            '3': slotFromJson({ key1: 30, label: 'future-v3', key3: true, key4: 'v3' }, 0, ''),
            [DEVICES_KEY]: slotFromJson(
                {
                    [device1]: { version: 3 }
                },
                0,
                ''
            )
        });

        const storage = createStorage({
            authorId: Buffer.from('device-1'),
            versions: v1,
            root
        }) as unknown as StorageImpl<unknown>;

        const exported = storage.exportSlot();

        expect(storage.hasNewerStorageVersions).toBe(true);
        expect(exported.v['1']).toBeDefined();
        expect(exported.v['2']).toBeDefined();
        expect(exported.v['3']).toBeDefined();
    });

    it('adds an author on an older schema version and materializes that version', () => {
        const storage = createStorage({
            authorId: Buffer.from('device-1'),
            versions: v3
        }) as StorageImpl<StorageV3>;

        storage.transaction(draft => {
            draft.set('key1', 42);
            draft.set('label', 'from-latest');
            draft.set('key3', true);
            draft.set('key4', 'latest-only');
        });

        let calls = 0;
        storage.onChange(() => {
            calls += 1;
        });

        storage.addAuthor(Buffer.from('device-v1'), 1);

        const exported = storage.exportSlot();

        expect(calls).toBe(1);
        expect(stripSlot(exported.v[DEVICES_KEY])).toEqual({
            [device1]: {
                version: 3
            },
            [deviceV1]: {
                version: 1
            }
        });
        expect(stripSlot(exported.v['1'])).toEqual({
            key1: 42,
            key2: 'from-latest'
        });
        expect(exported.v['2']).toBeUndefined();
        expect(stripSlot(exported.v['3'])).toEqual({
            key1: 42,
            label: 'from-latest',
            key3: true,
            key4: 'latest-only'
        });
    });

    it('rejects authors with unknown schema versions without changing storage', () => {
        const storage = createStorage({
            authorId: Buffer.from('device-1'),
            versions: v3
        });
        const before = storage.export();

        expect(() => {
            storage.addAuthor(Buffer.from('device-unknown'), 999);
        }).toThrow('Unknown storage version 999');

        expect(storage.export().equals(before)).toBe(true);
    });

    it('leaves storage unchanged when adding an author fails version projection', () => {
        const schemaV1 = z.object({
            key: z.string()
        });
        const schemaV2 = z.object({
            key: z.string(),
            extra: z.boolean()
        });
        const brokenVersions = defineVersionHList(
            hCons(
                {
                    version: 2,
                    schema: schemaV2,
                    initial: {
                        key: 'initial',
                        extra: false
                    },
                    projectUp: projectIdentity,
                    projectDown: () => {
                        throw new Error('broken projection');
                    }
                },
                hCons(
                    {
                        version: 1,
                        schema: schemaV1,
                        initial: {
                            key: 'initial'
                        },
                        projectUp: projectIdentity,
                        projectDown: projectIdentity
                    },
                    hNil
                )
            )
        );
        const storage = createStorage({
            authorId: Buffer.from('device-1'),
            versions: brokenVersions
        });
        const before = storage.export();

        expect(() => {
            storage.addAuthor(Buffer.from('device-v1'), 1);
        }).toThrow('broken projection');

        expect(storage.export().equals(before)).toBe(true);
    });

    it('removes an author, marks its unused version for deletion, and keeps exports importable', () => {
        const now = Math.floor(new Date('2026-01-01T00:00:00.000Z').getTime() / 1000);
        vi.setSystemTime(new Date(now * 1000));
        const root = createOriginContainer({
            '1': slotFromJson({ key1: 10, key2: 'legacy' }, 0, ''),
            '3': slotFromJson(v3Initial, 0, ''),
            [DEVICES_KEY]: slotFromJson(
                {
                    [device1]: { version: 3 },
                    [oldDevice]: { version: 1 }
                },
                0,
                ''
            )
        });
        const storage = createStorage({
            authorId: Buffer.from('device-1'),
            versions: v3,
            root
        }) as StorageImpl<StorageV3>;

        let calls = 0;
        storage.onChange(() => {
            calls += 1;
        });

        storage.removeAuthor(Buffer.from('old-device'));

        const exported = storage.exportSlot();
        const encoded = storage.export();
        const imported = createStorage({
            authorId: Buffer.from('device-1'),
            versions: v3
        });
        imported.merge(encoded);

        expect(calls).toBe(1);
        expect(stripSlot(exported.v[DEVICES_KEY])).toEqual({
            [device1]: {
                version: 3
            }
        });
        expect(exported.v['1']).toBeDefined();
        expect(stripSlot(exported.v[VERSION_DELETION_KEY])).toEqual({
            '1': {
                shouldBeDeletedAt: now + VERSION_DELETION_GRACE_PERIOD_SECONDS
            }
        });
        expect(imported.read()).toEqual(v3Initial);
    });
});
