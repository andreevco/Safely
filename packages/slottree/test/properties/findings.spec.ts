import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { createStorage } from '../../src';
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

        a.update(draft => {
            draft.tick = '';
        });
        a.update(draft => {
            delete draft.deepMixed.c;
        });

        b.update(draft => {
            draft.deepMixed.c ??= {
                children: {}
            };

            draft.deepMixed.c.children.x = {
                value: null
            };
        });

        c.update(draft => {
            draft.tick = '';
        });
        c.update(draft => {
            draft.deepMixed.c = {
                children: {}
            };
        });

        function fullMeshSync() {
            a.merge(b.export());
            a.merge(c.export());

            b.merge(a.export());
            b.merge(c.export());

            c.merge(a.export());
            c.merge(b.export());
        }

        fullMeshSync();

        const aAfterFirst = a.export();
        const bAfterFirst = b.export();
        const cAfterFirst = c.export();

        fullMeshSync();

        expect(a.export()).toEqual(aAfterFirst);
        expect(b.export()).toEqual(bAfterFirst);
        expect(c.export()).toEqual(cAfterFirst);
    });
});
