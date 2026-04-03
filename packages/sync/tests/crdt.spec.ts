import { describe, it, expect } from 'vitest';
import * as Y from 'yjs';
import { z } from 'zod';

import { zArrayWithKey } from '../src';
import { YCRDT } from '../src/crdt/y-crdt';

describe('crdt', () => {
    let crdt1: YCRDT;
    let crdt2: YCRDT;

    function setup(schema: Record<string, z.ZodType>) {
        crdt1 = new YCRDT(new Y.Doc(), schema);
        crdt2 = new YCRDT(new Y.Doc(), schema);
    }

    function sync() {
        const update1 = crdt1.encodeAsSnapshot();
        const update2 = crdt2.encodeAsSnapshot();

        crdt1.applyUpdate(update2, 'sync');
        crdt2.applyUpdate(update1, 'sync');
    }

    function expectContainAll(received: unknown[], expected: unknown[]) {
        for (const item of expected) {
            expect(received).toContain(item);
        }
    }

    it('should set and get values', () => {
        setup({
            key1: z.string(),
            key2: z.number(),
            key3: z.null(),
            key4: z.object({ nested: z.string() }),
            key5: zArrayWithKey(z.string(), item => item)
        });

        crdt1.set('key1', 'value1');
        crdt1.set('key2', 51);
        crdt1.set('key3', null);
        crdt1.set('key4', { nested: 'object' });
        crdt1.set('key5', ['array', 'of', 'values']);

        expect(crdt1.get('key1')).toBe('value1');
        expect(crdt1.get('key2')).toBe(51);
        expect(crdt1.get('key3')).toBeNull();
        expect(crdt1.get('key4')).toEqual({ nested: 'object' });
        expect(crdt1.get('key5')).toEqual(['array', 'of', 'values']);
    });

    describe('objects', () => {
        it('should set properties of the same object and merge', () => {
            setup({
                shared: z.object({
                    a: z.number(),
                    b: z.number()
                })
            });

            const obj = { a: 1, b: 2 };
            crdt1.set('shared', obj);
            sync();

            crdt1.set('shared', { a: 10, b: 2 });
            crdt2.set('shared', { a: 1, b: 20 });

            sync();
            expect(crdt1.get('shared')).toEqual({ a: 10, b: 20 });
            expect(crdt2.get('shared')).toEqual({ a: 10, b: 20 });
        });

        it('should add properties to the same object and merge', () => {
            setup({
                shared: z.object({
                    a: z.number(),
                    b: z.number().optional(),
                    c: z.number().optional()
                })
            });

            const obj = { a: 1 };
            crdt1.set('shared', obj);
            sync();

            crdt1.set('shared', { a: 1, b: 2 });
            crdt2.set('shared', { a: 1, c: 3 });

            sync();
            expect(crdt1.get('shared')).toEqual({ a: 1, b: 2, c: 3 });
            expect(crdt2.get('shared')).toEqual({ a: 1, b: 2, c: 3 });
        });

        it('should remove properties from the same object and merge', () => {
            setup({
                shared: z.object({
                    a: z.number(),
                    b: z.number().optional(),
                    c: z.number().optional()
                })
            });

            const obj = { a: 1, b: 2, c: 3 };
            crdt1.set('shared', obj);
            sync();

            crdt1.set('shared', { a: 1, b: 2 });
            crdt2.set('shared', { a: 1, c: 3 });

            sync();
            expect(crdt1.get('shared')).toEqual({ a: 1 });
            expect(crdt2.get('shared')).toEqual({ a: 1 });
        });

        it('should add and remove properties from the same object and merge', () => {
            setup({
                shared: z.object({
                    a: z.number(),
                    b: z.number().optional(),
                    c: z.number().optional()
                })
            });

            const obj = { a: 1, b: 2 };
            crdt1.set('shared', obj);
            sync();

            crdt1.set('shared', { a: 1 });
            crdt2.set('shared', { a: 1, c: 3 });

            sync();
            expect(crdt1.get('shared')).toEqual({ a: 1, c: 3 });
            expect(crdt2.get('shared')).toEqual({ a: 1, c: 3 });
        });
    });

    describe('arrays', () => {
        it('should merge arrays by id', () => {
            setup({
                shared: zArrayWithKey(z.string(), item => item)
            });

            crdt1.set('shared', ['a', 'b', 'c']);
            sync();

            crdt1.set('shared', ['a', 'b', 'c', 'd']);
            crdt2.set('shared', ['a', 'b', 'c', 'e']);

            sync();
            expect(crdt1.get('shared')).toEqual(['a', 'b', 'c', 'd', 'e']);
            expect(crdt2.get('shared')).toEqual(['a', 'b', 'c', 'd', 'e']);
        });

        it('should remove items from arrays by id', () => {
            setup({
                shared: zArrayWithKey(z.string(), item => item)
            });

            crdt1.set('shared', ['a', 'b', 'c']);
            sync();

            crdt1.set('shared', ['a', 'b']);
            crdt2.set('shared', ['a', 'c']);

            sync();
            expect(crdt1.get('shared')).toEqual(['a']);
            expect(crdt2.get('shared')).toEqual(['a']);
        });

        it('should merge arrays by id with concurrent adds and removes', () => {
            setup({
                shared: zArrayWithKey(z.string(), item => item)
            });

            crdt1.set('shared', ['a', 'b', 'c']);
            sync();

            crdt1.set('shared', ['a', 'b', 'd']);
            crdt2.set('shared', ['a', 'c', 'e']);

            sync();
            expectContainAll(crdt1.get('shared') as unknown[], ['a', 'd', 'e']);
            expectContainAll(crdt2.get('shared') as unknown[], ['a', 'd', 'e']);
        });

        it('should deep merge arrays of objects by id', () => {
            setup({
                shared: zArrayWithKey(
                    z.object({
                        id: z.string(),
                        value: z.number()
                    }),
                    item => item.id
                )
            });

            crdt1.set('shared', [
                { id: 'a', value: 1 },
                { id: 'b', value: 2 }
            ]);
            sync();

            crdt1.set('shared', [
                { id: 'a', value: 10 },
                { id: 'b', value: 2 }
            ]);
            crdt2.set('shared', [
                { id: 'a', value: 1 },
                { id: 'b', value: 20 }
            ]);

            sync();
            expect(crdt1.get('shared')).toEqual([
                { id: 'a', value: 10 },
                { id: 'b', value: 20 }
            ]);
            expect(crdt2.get('shared')).toEqual([
                { id: 'a', value: 10 },
                { id: 'b', value: 20 }
            ]);
        });
    });

    describe('nullable union schemas', () => {
        it('should set and get object with z.union([T, z.null()]) schema', () => {
            setup({
                meta: z.union([
                    z.object({
                        name: z.string(),
                        icon: z.union([
                            z.object({ type: z.literal('emoji'), value: z.string() }),
                            z.object({ type: z.literal('color'), value: z.string() })
                        ])
                    }),
                    z.null()
                ])
            });

            crdt1.set('meta', {
                name: 'Test Account',
                icon: { type: 'color', value: '#FF0000' }
            });

            expect(crdt1.get('meta')).toEqual({
                name: 'Test Account',
                icon: { type: 'color', value: '#FF0000' }
            });
        });

        it('should set and get array with z.union([zArrayWithKey(...), z.null()]) schema', () => {
            setup({
                items: z.union([
                    zArrayWithKey(z.object({ id: z.string(), value: z.number() }), item => item.id),
                    z.null()
                ])
            });

            crdt1.set('items', [
                { id: 'a', value: 1 },
                { id: 'b', value: 2 }
            ]);

            expect(crdt1.get('items')).toEqual([
                { id: 'a', value: 1 },
                { id: 'b', value: 2 }
            ]);
        });

        it('should set and get record with z.union([z.record(...), z.null()]) schema', () => {
            setup({
                devices: z.union([
                    z.record(
                        z.string(),
                        z.object({
                            name: z.string(),
                            platform: z.string()
                        })
                    ),
                    z.null()
                ])
            });

            crdt1.set('devices', {
                device1: { name: 'iPhone', platform: 'ios' },
                device2: { name: 'Pixel', platform: 'android' }
            });

            expect(crdt1.get('devices')).toEqual({
                device1: { name: 'iPhone', platform: 'ios' },
                device2: { name: 'Pixel', platform: 'android' }
            });
        });

        it('should set and get object with .transform() schema', () => {
            setup({
                item: z.union([
                    z.object({
                        id: z
                            .object({
                                type: z.literal('bip39'),
                                hash: z.string()
                            })
                            .transform(val => `${val.type}:${val.hash}`),
                        meta: z.object({
                            name: z.string(),
                            icon: z.union([
                                z.object({ type: z.literal('emoji'), value: z.string() }),
                                z.object({ type: z.literal('color'), value: z.string() })
                            ])
                        }),
                        derivations: zArrayWithKey(
                            z.object({
                                index: z.number(),
                                chains: z.object({ xpub: z.string() })
                            }),
                            item => String(item.index)
                        )
                    }),
                    z.null()
                ])
            });

            crdt1.set('item', {
                id: { type: 'bip39', hash: 'abc123' },
                meta: { name: 'Wallet 1', icon: { type: 'color', value: '#FF0000' } },
                derivations: [{ index: 0, chains: { xpub: 'xpub123' } }]
            });

            expect(crdt1.get('item')).toEqual({
                id: { type: 'bip39', hash: 'abc123' },
                meta: { name: 'Wallet 1', icon: { type: 'color', value: '#FF0000' } },
                derivations: [{ index: 0, chains: { xpub: 'xpub123' } }]
            });
        });

        it('should merge nullable union arrays across peers', () => {
            setup({
                items: z.union([
                    zArrayWithKey(z.object({ id: z.string(), value: z.number() }), item => item.id),
                    z.null()
                ])
            });

            crdt1.set('items', [
                { id: 'a', value: 1 },
                { id: 'b', value: 2 }
            ]);
            sync();

            crdt1.set('items', [
                { id: 'a', value: 10 },
                { id: 'b', value: 2 }
            ]);
            crdt2.set('items', [
                { id: 'a', value: 1 },
                { id: 'b', value: 20 }
            ]);

            sync();
            expect(crdt1.get('items')).toEqual([
                { id: 'a', value: 10 },
                { id: 'b', value: 20 }
            ]);
        });
    });

    it('should check equality of CRDTs', () => {
        setup({
            key: z.string()
        });

        crdt1.set('key', 'value');
        sync();

        expect(crdt1.equals(crdt2)).toBe(true);

        crdt1.set('key', 'new value');
        expect(crdt1.equals(crdt2)).toBe(false);

        sync();
        expect(crdt1.equals(crdt2)).toBe(true);
    });

    it('should remove keys', () => {
        setup({
            key: z.string().optional()
        });

        crdt1.set('key', 'value');
        sync();

        expect(crdt1.get('key')).toBe('value');
        expect(crdt2.get('key')).toBe('value');

        crdt1.remove('key');
        sync();

        expect(crdt1.get('key')).toBeNull();
        expect(crdt2.get('key')).toBeNull();
    });

    it('should throw exception and do not apply any updates', () => {
        const schema = {
            value: z.object({
                key1: z.string(),
                key2: z.array(z.number())
            })
        };
        const doc = new Y.Doc();
        const root = doc.getMap('root');
        root.set(
            'value',
            (() => {
                const map = new Y.Map();
                map.set('key1', 'value');
                map.set('key2', new Y.Map());
                return map;
            })()
        );

        crdt1 = new YCRDT(doc, schema);

        let thrown = false;
        try {
            crdt1.set('value', {
                key1: 'new value',
                key2: [1, 2, 3]
            });
        } catch {
            thrown = true;
        }
        if (!thrown) {
            throw new Error('Expected to throw an error');
        }
        // @ts-expect-error - type is unknown, but we know it's a Y.Map
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        expect(root.get('value').get('key1')).toBe('value');
    });
});
