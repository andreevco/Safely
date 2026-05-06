import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { createStorage, DEVICES_KEY, StorageImpl } from '../src';
import { identityProjection, StorageV1, type StorageV3, v1, v3 } from './version-fixtures';
import { createOriginContainer, type ContainerSlot } from '../src/core/slots';
import { slotFromJson } from '../src/core/slots/slot-json';
import { projection } from '../src/core/versioning/projection';
import { defineVersionHList, hCons, hNil } from '../src/core/versioning/version';

describe('version migration', () => {
    it('initializes the latest version by migrating an existing older version', () => {
        const root = createOriginContainer({
            '1': slotFromJson({ key1: 42, key2: 'from-v1' }, 123, 'old-device')
        });

        const storage = createStorage({
            authorId: 'device-1',
            versions: v3,
            root
        }) as StorageImpl<StorageV3>;

        expect(storage.read()).toEqual({
            key1: 42,
            label: 'from-v1',
            key3: false,
            key4: 'v3'
        });

        const exported = storage.exportSlot() as ContainerSlot;
        const v3Slot = exported.v['3'] as ContainerSlot;

        expect(exported.v['1']).toBeUndefined();
        expect(exported.v['2']).toBeUndefined();
        expect(v3Slot.v.key1).toMatchObject({
            v: 42,
            t: 123,
            a: 'old-device'
        });
        expect(v3Slot.v.label).toMatchObject({
            v: 'from-v1',
            t: 123,
            a: 'old-device'
        });
        expect(v3Slot.v.key3).toMatchObject({ v: false, t: 0, a: '' });
        expect(v3Slot.v.key4).toMatchObject({ v: 'v3', t: 0, a: '' });
    });

    it('propagates latest updates to existing older versions', () => {
        const root = createOriginContainer({
            '1': slotFromJson({ key1: 0, key2: 'initial' }, 0, ''),
            '2': slotFromJson({ key1: 0, key2: 'initial', key3: false }, 0, ''),
            '3': slotFromJson({ key1: 0, label: 'initial', key3: false, key4: 'v3' }, 0, ''),
            [DEVICES_KEY]: slotFromJson(
                {
                    'device-1': { version: 3 },
                    'device-v1': { version: 1 },
                    'device-v2': { version: 2 }
                },
                0,
                ''
            )
        });

        const storage = createStorage({
            authorId: 'device-1',
            versions: v3,
            root
        }) as StorageImpl<StorageV3>;

        storage.update(draft => {
            draft.key1 = 10;
            draft.label = 'updated';
            draft.key4 = 'latest-only';
        });

        const exported = storage.exportSlot() as ReturnType<typeof createOriginContainer>;
        expect(exported.v['2']).toMatchObject({
            v: {
                key1: { v: 10 },
                key2: { v: 'updated', a: 'device-1' },
                key3: { v: false, t: 0 }
            }
        });
        expect(exported.v['1']).toMatchObject({
            v: {
                key1: { v: 10 },
                key2: { v: 'updated', a: 'device-1' }
            }
        });

        const v3Slot = exported.v['3'] as ContainerSlot;
        const v2Slot = exported.v['2'] as ContainerSlot;
        const v1Slot = exported.v['1'] as ContainerSlot;
        expect(v2Slot.v.key2).toMatchObject({
            t: v3Slot.v.label?.t,
            a: v3Slot.v.label?.a
        });
        expect(v1Slot.v.key2).toMatchObject({
            t: v3Slot.v.label?.t,
            a: v3Slot.v.label?.a
        });
    });

    it('propagates through missing older versions without creating them', () => {
        const root = createOriginContainer({
            '1': slotFromJson({ key1: 0, key2: 'initial' }, 0, ''),
            '3': slotFromJson({ key1: 0, label: 'initial', key3: false, key4: 'v3' }, 0, ''),
            [DEVICES_KEY]: slotFromJson(
                {
                    'device-1': { version: 3 },
                    'device-v1': { version: 1 }
                },
                0,
                ''
            )
        });

        const storage = createStorage({
            authorId: 'device-1',
            versions: v3,
            root
        }) as StorageImpl<StorageV3>;

        storage.update(draft => {
            draft.label = 'updated';
        });

        const exported = storage.exportSlot() as ReturnType<typeof createOriginContainer>;
        expect(exported.v['2']).toBeUndefined();
        expect(exported.v['1']).toMatchObject({
            v: {
                key1: { v: 0, t: 0 },
                key2: { v: 'updated' }
            }
        });
    });

    it('migrates older-version edits up after merge', () => {
        const oldDevice = createStorage({
            authorId: 'old-device',
            versions: v1
        }) as StorageImpl<StorageV1>;
        const newDevice = createStorage({
            authorId: 'new-device',
            versions: v3
        }) as StorageImpl<StorageV3>;

        oldDevice.update(draft => {
            draft.key1 = 42;
            draft.key2 = 'from-v1';
        });

        newDevice.merge(oldDevice.export());

        const oldExport = oldDevice.exportSlot() as ContainerSlot;
        const newExport = newDevice.exportSlot() as ContainerSlot;
        const oldV1 = oldExport.v['1'] as ContainerSlot;
        const newV3 = newExport.v['3'] as ContainerSlot;

        expect(newDevice.read()).toEqual({
            key1: 42,
            label: 'from-v1',
            key3: false,
            key4: 'v3'
        });
        expect(newV3.v.label).toMatchObject({
            t: oldV1.v.key2?.t,
            a: oldV1.v.key2?.a
        });
        expect(newV3.v.key4).toMatchObject({ t: 0, a: '' });
    });

    it('preserves tombstones through raw slot projections', () => {
        const schemaOptionalV1 = z.object({
            keep: z.string(),
            optional: z.string().optional()
        });
        const schemaOptionalV2 = z.object({
            keep: z.string(),
            renamed: z.string().optional(),
            added: z.boolean()
        });

        const projectOptionalV1ToV2 = projection(schemaOptionalV1, schemaOptionalV2, s => ({
            keep: s.copy(),
            renamed: s.from('optional'),
            added: s.default(false)
        }));

        const projectOptionalV2ToV1 = projection(schemaOptionalV2, schemaOptionalV1, s => ({
            keep: s.copy(),
            optional: s.from('renamed')
        }));

        const optionalV2 = defineVersionHList(
            hCons(
                {
                    version: 2,
                    schema: schemaOptionalV2,
                    initial: {
                        keep: '',
                        renamed: 'initial',
                        added: false
                    },
                    projectUp: projectOptionalV1ToV2,
                    projectDown: projectOptionalV2ToV1
                },
                hCons(
                    {
                        version: 1,
                        schema: schemaOptionalV1,
                        initial: {
                            keep: '',
                            optional: 'initial'
                        },
                        projectUp: identityProjection,
                        projectDown: identityProjection
                    },
                    hNil
                )
            )
        );
        const optionalV1 = defineVersionHList(
            hCons(
                {
                    version: 1,
                    schema: schemaOptionalV1,
                    initial: {
                        keep: '',
                        optional: 'initial'
                    },
                    projectUp: identityProjection,
                    projectDown: identityProjection
                },
                hNil
            )
        );

        const oldDevice = createStorage({
            authorId: 'old-device',
            versions: optionalV1
        }) as StorageImpl<z.output<typeof schemaOptionalV1>>;
        const newDevice = createStorage({
            authorId: 'new-device',
            versions: optionalV2
        }) as StorageImpl<z.output<typeof schemaOptionalV2>>;

        oldDevice.update(draft => {
            delete draft.optional;
        });

        newDevice.merge(oldDevice.export());

        const oldExport = oldDevice.exportSlot() as ContainerSlot;
        const newExport = newDevice.exportSlot() as ContainerSlot;
        const oldTombstone = (oldExport.v['1'] as ContainerSlot).v.optional;
        const projectedTombstone = (newExport.v['2'] as ContainerSlot).v.renamed;

        expect(projectedTombstone).toEqual(oldTombstone);
        expect(projectedTombstone).toMatchObject({ d: true, a: 'old-device' });
    });
});
