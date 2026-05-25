import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { createStorage, jsonEncoder } from '../../src';
import { cloneSlot } from '../../src/core/slots/slot-json';
import { defineVersionHList, hCons, hNil } from '../../src/core/versioning/version';

describe('Storage merge findings', () => {
    /*
     * Test case:
     * - suppose we have 3 clients A, B, C
     * - A deletes X on t=102
     * - B modifies X.c on t=101
     * - C modifies X on t=102
     *
     * Expected result:
     * - A x (B x C) = (A x B) x C = C's version winning in every case
     * */
    it('reproduces broken associativity on 3 clients with tombstone in between them', () => {
        const schema = z.object({
            tick: z.string(),
            deepMixed: z.record(
                z.string(),
                z.object({
                    children: z.record(
                        z.string(),
                        z.object({
                            value: z.null()
                        })
                    )
                })
            )
        });

        const versions = defineVersionHList(
            hCons(
                {
                    version: 1,
                    schema,
                    initial: {
                        tick: '',
                        deepMixed: {}
                    },
                    projectUp: cloneSlot,
                    projectDown: cloneSlot
                },
                hNil
            )
        );

        function makeStorage(authorId: string) {
            return createStorage({
                authorId,
                versions
            });
        }

        const a = makeStorage('A');
        const b = makeStorage('B');
        const c = makeStorage('C');

        a.transaction(draft => {
            draft.set('tick', '');
        });
        a.transaction(draft => {
            draft.at('deepMixed').delete('c');
        });

        b.transaction(draft => {
            draft.at('deepMixed').set(
                'c',
                draft.at('deepMixed').entry('c').get() ?? {
                    children: {}
                }
            );

            draft.at('deepMixed').entry('c').unwrap().at('children').set('x', {
                value: null
            });
        });

        c.transaction(draft => {
            draft.set('tick', '');
        });
        c.transaction(draft => {
            draft.at('deepMixed').set('c', {
                children: {}
            });
        });

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
    });
});
