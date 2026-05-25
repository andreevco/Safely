import * as fc from 'fast-check';
import { describe, expect, it } from 'vitest';

import { applyOps, opsArb } from './ops';
import { stressVersionList } from './stress-schema';
import { createStorage, jsonEncoder } from '../../src';

function makeStorage(authorId: string) {
    return createStorage({
        authorId,
        versions: stressVersionList
    });
}

describe('Basic CRDT properties', () => {
    describe('Idempotence', () => {
        it('merging the same incoming state twice does not change visible state', () => {
            fc.assert(
                fc.property(opsArb, opsArb, (opsA, opsB) => {
                    const a = makeStorage('A');
                    const b = makeStorage('B');

                    applyOps(a, opsA);
                    applyOps(b, opsB);

                    const incoming = b.withEncoder(jsonEncoder).export();

                    a.withEncoder(jsonEncoder).merge(incoming);
                    const afterOnce = a.get();

                    a.withEncoder(jsonEncoder).merge(incoming);
                    const afterTwice = a.get();

                    expect(afterTwice).toEqual(afterOnce);
                }),
                {
                    numRuns: 1000
                }
            );
        });

        it('merging the same incoming state twice does not change inner slot tree', () => {
            fc.assert(
                fc.property(opsArb, opsArb, (opsA, opsB) => {
                    const a = makeStorage('A');
                    const b = makeStorage('B');

                    applyOps(a, opsA);
                    applyOps(b, opsB);

                    const incoming = b.withEncoder(jsonEncoder).export();

                    a.withEncoder(jsonEncoder).merge(incoming);
                    const afterOnce = a.withEncoder(jsonEncoder).export();

                    a.withEncoder(jsonEncoder).merge(incoming);
                    const afterTwice = a.withEncoder(jsonEncoder).export();

                    expect(afterTwice).toEqual(afterOnce);
                }),
                {
                    numRuns: 1000
                }
            );
        });

        it('repeated bidirectional sync is idempotent', () => {
            fc.assert(
                fc.property(opsArb, opsArb, (opsA, opsB) => {
                    const a = makeStorage('A');
                    const b = makeStorage('B');

                    applyOps(a, opsA);
                    applyOps(b, opsB);

                    a.withEncoder(jsonEncoder).merge(b.withEncoder(jsonEncoder).export());
                    b.withEncoder(jsonEncoder).merge(a.withEncoder(jsonEncoder).export());

                    const aAfterFirstSync = a.withEncoder(jsonEncoder).export();
                    const bAfterFirstSync = b.withEncoder(jsonEncoder).export();

                    a.withEncoder(jsonEncoder).merge(b.withEncoder(jsonEncoder).export());
                    b.withEncoder(jsonEncoder).merge(a.withEncoder(jsonEncoder).export());

                    expect(a.withEncoder(jsonEncoder).export()).toEqual(aAfterFirstSync);
                    expect(b.withEncoder(jsonEncoder).export()).toEqual(bAfterFirstSync);

                    expect(a.get()).toEqual(b.get());
                }),
                {
                    numRuns: 1000
                }
            );
        });

        it('repeated full mesh sync is idempotent', () => {
            fc.assert(
                fc.property(opsArb, opsArb, opsArb, (opsA, opsB, opsC) => {
                    const a = makeStorage('A');
                    const b = makeStorage('B');
                    const c = makeStorage('C');

                    applyOps(a, opsA);
                    applyOps(b, opsB);
                    applyOps(c, opsC);

                    function fullMeshSync() {
                        a.withEncoder(jsonEncoder).merge(b.withEncoder(jsonEncoder).export());
                        a.withEncoder(jsonEncoder).merge(c.withEncoder(jsonEncoder).export());

                        b.withEncoder(jsonEncoder).merge(a.withEncoder(jsonEncoder).export());
                        b.withEncoder(jsonEncoder).merge(c.withEncoder(jsonEncoder).export());

                        c.withEncoder(jsonEncoder).merge(a.withEncoder(jsonEncoder).export());
                        c.withEncoder(jsonEncoder).merge(b.withEncoder(jsonEncoder).export());
                    }

                    fullMeshSync();

                    const aAfterFirst = a.withEncoder(jsonEncoder).export();
                    const bAfterFirst = b.withEncoder(jsonEncoder).export();
                    const cAfterFirst = c.withEncoder(jsonEncoder).export();

                    fullMeshSync();

                    expect(a.withEncoder(jsonEncoder).export()).toEqual(aAfterFirst);
                    expect(b.withEncoder(jsonEncoder).export()).toEqual(bAfterFirst);
                    expect(c.withEncoder(jsonEncoder).export()).toEqual(cAfterFirst);

                    expect(a.get()).toEqual(b.get());
                    expect(b.get()).toEqual(c.get());
                }),
                {
                    numRuns: 1000
                }
            );
        });
    });

    describe('Commutativity', () => {
        it('merging two states in different order results in the same final state', () => {
            fc.assert(
                fc.property(opsArb, opsArb, (opsA, opsB) => {
                    const a = makeStorage('A');
                    const b = makeStorage('B');

                    applyOps(a, opsA);
                    applyOps(b, opsB);

                    const aState = a.withEncoder(jsonEncoder).export();
                    const bState = b.withEncoder(jsonEncoder).export();

                    a.withEncoder(jsonEncoder).merge(bState);
                    b.withEncoder(jsonEncoder).merge(aState);

                    expect(a.get()).toEqual(b.get());
                }),
                {
                    numRuns: 10000
                }
            );
        });
    });

    describe('Associativity', () => {
        it('merging multiple states in different groupings results in the same final state', () => {
            fc.assert(
                fc.property(opsArb, opsArb, opsArb, (opsA, opsB, opsC) => {
                    const a = makeStorage('A');
                    const b = makeStorage('B');
                    const c = makeStorage('C');

                    applyOps(a, opsA);
                    applyOps(b, opsB);
                    applyOps(c, opsC);

                    const aState = a.withEncoder(jsonEncoder).export();
                    const bState = b.withEncoder(jsonEncoder).export();
                    const cState = c.withEncoder(jsonEncoder).export();

                    // (A merge B) merge C
                    a.withEncoder(jsonEncoder).merge(bState);
                    a.withEncoder(jsonEncoder).merge(cState);

                    // A merge (B merge C)
                    b.withEncoder(jsonEncoder).merge(cState);
                    b.withEncoder(jsonEncoder).merge(aState);

                    expect(a.get()).toEqual(b.get());
                }),
                {
                    numRuns: 5000
                }
            );
        });
    });
});
