import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import { applyDeviceOps, deviceOpsArb, type VersioningWorld } from './ops';
import {
    type VersioningStateV1,
    type VersioningStateV2,
    type VersioningStateV3,
    versioningV1,
    versioningV2,
    versioningV3
} from './stress-schema';
import { createStorage, type SlotTree } from '../../../src';

const author1 = Buffer.from('versioning-device-1');
const author2 = Buffer.from('versioning-device-2');
const author3 = Buffer.from('versioning-device-3');

type ExportableStorage = {
    export(): Buffer;
    merge(incoming: Buffer): void;
};

describe('Versioning CRDT properties', () => {
    describe('Idempotence', () => {
        it('merging the same incoming state twice does not change normalized visible state', () => {
            fc.assert(
                fc.property(deviceOpsArb, deviceOpsArb, (opsA, opsB) => {
                    const a = makeWorld();
                    const b = makeWorld();

                    applyDeviceOps(a, opsA);
                    applyDeviceOps(b, opsB);

                    const incoming = b[3].export();

                    a[1].merge(incoming);
                    const afterOnce = normalizeRead(a[1]);

                    a[1].merge(incoming);
                    const afterTwice = normalizeRead(a[1]);

                    expect(afterTwice).toEqual(afterOnce);
                }),
                {
                    numRuns: 500
                }
            );
        });

        it('merging the same incoming state twice does not change inner slot tree', () => {
            fc.assert(
                fc.property(deviceOpsArb, deviceOpsArb, (opsA, opsB) => {
                    const a = makeWorld();
                    const b = makeWorld();

                    applyDeviceOps(a, opsA);
                    applyDeviceOps(b, opsB);

                    const incoming = b[3].export();

                    a[1].merge(incoming);
                    const afterOnce = a[1].export();

                    a[1].merge(incoming);
                    const afterTwice = a[1].export();

                    expect(afterTwice).toEqual(afterOnce);
                }),
                {
                    numRuns: 500
                }
            );
        });

        it('repeated bidirectional sync is idempotent', () => {
            fc.assert(
                fc.property(deviceOpsArb, deviceOpsArb, (opsA, opsB) => {
                    const a = makeWorld();
                    const b = makeWorld();

                    applyDeviceOps(a, opsA);
                    applyDeviceOps(b, opsB);

                    syncPairToFixedPoint(a[1], b[2]);

                    const aAfterFirstSync = a[1].export();
                    const bAfterFirstSync = b[2].export();

                    syncPair(a[1], b[2]);

                    expect(a[1].export()).toEqual(aAfterFirstSync);
                    expect(b[2].export()).toEqual(bAfterFirstSync);
                    expect(normalizeRead(a[1])).toEqual(normalizeRead(b[2]));
                }),
                {
                    numRuns: 500
                }
            );
        });

        it('repeated full mesh sync is idempotent', () => {
            fc.assert(
                fc.property(deviceOpsArb, ops => {
                    const world = makeWorld();
                    applyDeviceOps(world, ops);

                    fullMeshSyncToFixedPoint(world);

                    const aAfterFirst = world[1].export();
                    const bAfterFirst = world[2].export();
                    const cAfterFirst = world[3].export();

                    fullMeshSync(world);

                    expect(world[1].export()).toEqual(aAfterFirst);
                    expect(world[2].export()).toEqual(bAfterFirst);
                    expect(world[3].export()).toEqual(cAfterFirst);

                    expect(normalizeRead(world[1])).toEqual(normalizeRead(world[2]));
                    expect(normalizeRead(world[2])).toEqual(normalizeRead(world[3]));
                }),
                {
                    numRuns: 500
                }
            );
        });
    });

    describe('Commutativity', () => {
        it('merging versioned states in different order results in the same normalized state', () => {
            fc.assert(
                fc.property(deviceOpsArb, ops => {
                    const world = makeWorld();
                    applyDeviceOps(world, ops);

                    const first = collectAsV3([
                        world[1].export(),
                        world[2].export(),
                        world[3].export()
                    ]);
                    const second = collectAsV3([
                        world[3].export(),
                        world[2].export(),
                        world[1].export()
                    ]);

                    expect(second.get()).toEqual(first.get());
                }),
                {
                    numRuns: 2000
                }
            );
        });
    });

    describe('Associativity', () => {
        it('merging multiple versioned states in different groupings results in the same state', () => {
            fc.assert(
                fc.property(deviceOpsArb, ops => {
                    const world = makeWorld();
                    applyDeviceOps(world, ops);

                    const aState = world[1].export();
                    const bState = world[2].export();
                    const cState = world[3].export();

                    const ab = collectAsV3([aState, bState]);
                    const left = collectAsV3([ab.export(), cState]);

                    const bc = collectAsV3([bState, cState]);
                    const right = collectAsV3([aState, bc.export()]);

                    expect(left.get()).toEqual(right.get());
                }),
                {
                    numRuns: 1000
                }
            );
        });
    });
});

function makeWorld(): VersioningWorld {
    const first: SlotTree<VersioningStateV1> = createStorage({
        authorId: author1,
        versions: versioningV1
    });
    const second: SlotTree<VersioningStateV2> = createStorage({
        authorId: author2,
        versions: versioningV2
    });
    const third: SlotTree<VersioningStateV3> = createStorage({
        authorId: author3,
        versions: versioningV3
    });

    second.addAuthor(author1, 1);
    third.addAuthor(author1, 1);
    third.addAuthor(author2, 2);

    return {
        1: first,
        2: second,
        3: third
    };
}

function syncPair(left: ExportableStorage, right: ExportableStorage): void {
    left.merge(right.export());
    right.merge(left.export());
}

function syncPairToFixedPoint(left: ExportableStorage, right: ExportableStorage): void {
    syncPair(left, right);
    syncPair(left, right);
}

function fullMeshSync(world: VersioningWorld): void {
    world[1].merge(world[2].export());
    world[1].merge(world[3].export());

    world[2].merge(world[1].export());
    world[2].merge(world[3].export());

    world[3].merge(world[1].export());
    world[3].merge(world[2].export());
}

function fullMeshSyncToFixedPoint(world: VersioningWorld): void {
    fullMeshSync(world);
    fullMeshSync(world);
}

function normalizeRead(storage: ExportableStorage): VersioningStateV3 {
    return collectAsV3([storage.export()]).get();
}

function collectAsV3(states: readonly Buffer[]): SlotTree<VersioningStateV3> {
    const storage: SlotTree<VersioningStateV3> = createStorage({
        authorId: Buffer.from('versioning-collector'),
        versions: versioningV3
    });

    storage.addAuthor(author1, 1);
    storage.addAuthor(author2, 2);

    for (const state of states) {
        storage.merge(state);
    }

    return storage;
}
