import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import type { StorageImpl } from '../src';
import { createStorage } from '../src';
import {
    isContainerSlot,
    isOrderedArraySlot,
    isTombstoneSlot,
    SlotKind,
    type ContainerSlot
} from '../src/core/slots';
import { cloneSlot, slotFromJson } from '../src/core/slots/slot-json';
import { defineVersionHList, hCons, hNil } from '../src/core/versioning/version';

const sPortfolio = z.object({
    __setId: z.string(),
    name: z.string()
});

const schema = z.object({
    portfolios: z.array(sPortfolio)
});

const versions = defineVersionHList(
    hCons(
        {
            version: 1,
            schema,
            initial: {
                portfolios: []
            },
            projectUp: cloneSlot,
            projectDown: cloneSlot
        },
        hNil
    )
);

type State = z.output<typeof schema>;

function createPortfolioStorage(authorId: string): StorageImpl<State> {
    return createStorage({
        authorId,
        versions
    }) as StorageImpl<State>;
}

function latest(storage: StorageImpl<State>): ContainerSlot {
    const root = storage.exportSlot();
    if (!isContainerSlot(root)) {
        throw new Error('Expected root container');
    }

    const versionSlot = root.v['1'];
    if (!isContainerSlot(versionSlot)) {
        throw new Error('Expected version container');
    }

    return versionSlot;
}

describe('ordered array slots', () => {
    it('stores an initial empty array as an ordered array but exposes an external array', () => {
        const storage = createPortfolioStorage('device-1');

        expect(storage.get().portfolios).toEqual([]);

        const portfolios = latest(storage).v.portfolios;
        expect(portfolios?.s).toBe(SlotKind.OrderedArray);
    });

    it('pushes items into an ordered array slot', () => {
        const storage = createPortfolioStorage('device-1');

        storage.transaction(draft => {
            draft.at('portfolios').push({ __setId: 'p1', name: 'Main' });
        });

        expect(storage.get().portfolios).toEqual([{ __setId: 'p1', name: 'Main' }]);

        const portfolios = latest(storage).v.portfolios;
        expect(isOrderedArraySlot(portfolios)).toBe(true);
        expect(isOrderedArraySlot(portfolios) ? portfolios.v.p1 : undefined).toBeDefined();
    });

    it('inserts and moves by id while preserving external order', () => {
        const storage = createPortfolioStorage('device-1');

        storage.transaction(draft => {
            draft.at('portfolios').push({ __setId: 'p1', name: 'One' });
            draft.at('portfolios').push({ __setId: 'p2', name: 'Two' });
            draft.at('portfolios').insert(2, { __setId: 'p3', name: 'Three' });
            draft.at('portfolios').move('p3', 0);
        });

        expect(storage.get().portfolios.map(item => item.__setId)).toEqual(['p3', 'p1', 'p2']);
        expect(storage.read().portfolios.map(item => item.__setId)).toEqual(['p3', 'p1', 'p2']);
    });

    it('removes items with tombstones', () => {
        const storage = createPortfolioStorage('device-1');

        storage.transaction(draft => {
            draft.at('portfolios').push({ __setId: 'p1', name: 'One' });
            draft.at('portfolios').push({ __setId: 'p2', name: 'Two' });
            draft.at('portfolios').remove('p2');
        });

        expect(storage.get().portfolios).toEqual([{ __setId: 'p1', name: 'One' }]);

        const portfolios = latest(storage).v.portfolios;
        if (!isOrderedArraySlot(portfolios)) {
            throw new Error('Expected ordered array');
        }

        expect(isTombstoneSlot(portfolios.v.p2)).toBe(true);
    });

    it('updates items by id', () => {
        const storage = createPortfolioStorage('device-1');

        storage.transaction(draft => {
            draft.at('portfolios').push({ __setId: 'p1', name: 'One' });
            draft.at('portfolios').push({ __setId: 'p2', name: 'Two' });
            draft.at('portfolios').update('p1', item => {
                item.set('name', 'Main');
            });
            draft.at('portfolios').update('p2', item => {
                item.set('name', 'Second');
            });
        });

        expect(storage.get().portfolios).toEqual([
            { __setId: 'p1', name: 'Main' },
            { __setId: 'p2', name: 'Second' }
        ]);
    });

    it('rejects updates that change item id', () => {
        const storage = createPortfolioStorage('device-1');

        storage.transaction(draft => {
            draft.at('portfolios').push({ __setId: 'p1', name: 'One' });
        });

        expect(() =>
            storage.transaction(draft => {
                draft.at('portfolios').update('p1', item => {
                    item.set('__setId', 'p2');
                });
            })
        ).toThrow('Updated item id must remain "p1"');

        expect(storage.get().portfolios).toEqual([{ __setId: 'p1', name: 'One' }]);
    });

    it('reads items by id', () => {
        const storage = createPortfolioStorage('device-1');

        storage.transaction(draft => {
            draft.at('portfolios').push({ __setId: 'p1', name: 'One' });
            expect(draft.at('portfolios').getById('p1')).toEqual({
                __setId: 'p1',
                name: 'One'
            });
            expect(draft.at('portfolios').getById('missing')).toBeUndefined();
        });
    });

    it('reorders items by full id list', () => {
        const storage = createPortfolioStorage('device-1');

        storage.transaction(draft => {
            draft.at('portfolios').push({ __setId: 'p1', name: 'One' });
            draft.at('portfolios').push({ __setId: 'p2', name: 'Two' });
            draft.at('portfolios').push({ __setId: 'p3', name: 'Three' });
            draft.at('portfolios').reorder(['p3', 'p1', 'p2']);
        });

        expect(storage.get().portfolios.map(item => item.__setId)).toEqual(['p3', 'p1', 'p2']);
    });

    it('rejects reorder lists that do not match live items', () => {
        const storage = createPortfolioStorage('device-1');

        storage.transaction(draft => {
            draft.at('portfolios').push({ __setId: 'p1', name: 'One' });
            draft.at('portfolios').push({ __setId: 'p2', name: 'Two' });
        });

        expect(() =>
            storage.transaction(draft => {
                draft.at('portfolios').reorder(['p1']);
            })
        ).toThrow('expected 2 ids');

        expect(() =>
            storage.transaction(draft => {
                draft.at('portfolios').reorder(['p1', 'missing']);
            })
        ).toThrow('unknown id');
    });

    it('rejects duplicate live ids', () => {
        const storage = createPortfolioStorage('device-1');

        storage.transaction(draft => {
            draft.at('portfolios').push({ __setId: 'p1', name: 'One' });
        });

        expect(() =>
            storage.transaction(draft => {
                draft.at('portfolios').push({ __setId: 'p1', name: 'Duplicate' });
            })
        ).toThrow('already exists');
    });

    it('merges concurrent pushes into an initially empty array', () => {
        const a = createPortfolioStorage('device-a');
        const b = createPortfolioStorage('device-b');

        a.transaction(draft => {
            draft.at('portfolios').push({ __setId: 'p1', name: 'One' });
        });
        b.transaction(draft => {
            draft.at('portfolios').push({ __setId: 'p2', name: 'Two' });
        });

        a.merge(b.export());
        b.merge(a.export());

        expect(a.get().portfolios).toEqual([
            { __setId: 'p1', name: 'One' },
            { __setId: 'p2', name: 'Two' }
        ]);
        expect(b.get()).toEqual(a.get());
    });

    it('merges a concurrent update and move on the same item', () => {
        const seed = createPortfolioStorage('seed');
        seed.transaction(draft => {
            draft.at('portfolios').push({ __setId: 'p1', name: 'One' });
            draft.at('portfolios').push({ __setId: 'p2', name: 'Two' });
        });

        const a = createStorage({
            authorId: 'device-a',
            versions,
            root: seed.exportSlot() as ContainerSlot
        }) as StorageImpl<State>;
        const b = createStorage({
            authorId: 'device-b',
            versions,
            root: seed.exportSlot() as ContainerSlot
        }) as StorageImpl<State>;

        a.transaction(draft => {
            draft.at('portfolios').move('p2', 0);
        });
        b.transaction(draft => {
            draft.at('portfolios').update('p2', item => {
                item.set('name', 'Second');
            });
        });

        a.merge(b.export());
        b.merge(a.export());

        expect(a.get().portfolios).toEqual([
            { __setId: 'p2', name: 'Second' },
            { __setId: 'p1', name: 'One' }
        ]);
        expect(b.get()).toEqual(a.get());
    });

    it('roundtrips ordered arrays through export and import', () => {
        const storage = createPortfolioStorage('device-1');
        storage.transaction(draft => {
            draft.at('portfolios').push({ __setId: 'p1', name: 'One' });
            draft.at('portfolios').push({ __setId: 'p2', name: 'Two' });
            draft.at('portfolios').move('p2', 0);
            draft.at('portfolios').update('p2', item => {
                item.set('name', 'Second');
            });
        });

        const imported = createStorage({
            authorId: 'device-2',
            versions,
            root: JSON.parse(storage.export()) as ContainerSlot
        });

        expect(imported.get()).toEqual(storage.get());
    });

    it('rejects array items without string __setIds', () => {
        expect(() => slotFromJson(['tag'], 0, '')).toThrow('string __setId');
        expect(() => slotFromJson([{ name: 'Missing id' }], 0, '')).toThrow('string __setId');
    });
});
