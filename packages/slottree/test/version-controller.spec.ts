import { describe, expect, it } from 'vitest';

import { VersionController } from '../src';
import { v3 } from './version-fixtures';
import { createOriginContainer, type ContainerSlot } from '../src/core/slots';
import { slotFromJson, stripSlot } from '../src/core/slots/slot-json';
import { hListToRuntimeArray } from '../src/core/versioning/version';

describe('VersionController', () => {
    it('controls top-level version slots', () => {
        const versions = hListToRuntimeArray(v3);
        const root = createOriginContainer({
            '1': slotFromJson({ key1: 42, key2: 'from-v1' }, 123, 'old-device')
        });
        const controller = new VersionController(root, versions);

        expect(controller.get(1)).toBe(root.v['1']);

        const latest = controller.createVersionFrom(1);
        const v1Slot = root.v['1'] as ContainerSlot;

        expect(latest).toBe(root.v['3']);
        expect(root.v['2']).toBeUndefined();
        expect(latest?.v.key1).toEqual(v1Slot.v.key1);
        expect(latest?.v.label).toEqual(v1Slot.v.key2);
        expect(latest?.v.key3).toMatchObject({ v: false, t: 0, a: '' });
        expect(latest?.v.key4).toMatchObject({ v: 'v3', t: 0, a: '' });

        controller.delete(1);

        expect(controller.get(1)).toBeUndefined();
    });

    it('creates the latest version from initial data', () => {
        const versions = hListToRuntimeArray(v3);
        const root = createOriginContainer();
        const controller = new VersionController(root, versions);

        const latest = controller.createInitialVersion();

        expect(latest).toBe(root.v['3']);
        expect(stripSlot(controller.get(3))).toEqual({
            key1: 0,
            label: 'initial',
            key3: false,
            key4: 'v3'
        });
    });
});
