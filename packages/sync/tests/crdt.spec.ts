import { describe, it, expect } from 'vitest';
import * as Y from 'yjs';
import { z } from 'zod';

import { sSecretEncrypted, zArrayWithKey } from '../src';
import {
    AnySchemaRecord,
    chainToRuntimeArray,
    defineStorageVersion,
    defineVersionChain,
    OutputOfRecord
} from '../src/crdt/version';
import { YCRDT } from '../src/crdt/y-crdt';

describe('crdt', () => {
    let crdt1: YCRDT;
    let crdt2: YCRDT;

    function setup<S extends AnySchemaRecord>(schema: S, defaultValues: OutputOfRecord<S>) {
        const versions = chainToRuntimeArray(
            defineVersionChain(
                // TODO: remove empty object?
                // eslint-disable-next-line @typescript-eslint/no-empty-object-type
                defineStorageVersion<{}, S>({
                    version: 1,
                    schema,
                    migrate: _ => defaultValues,
                    reverseMigrate: _ => {
                        return {};
                    }
                })
            )
        );

        crdt1 = YCRDT.create(new Y.Doc(), versions, 'device-1');
        crdt2 = YCRDT.create(new Y.Doc(), versions, 'device-2');

        sync();
    }

    function sync() {
        crdt1.applyUpdate(crdt2.encodeAsSnapshot(), 'sync', 1);
        crdt2.applyUpdate(crdt1.encodeAsSnapshot(), 'sync', 1);
    }

    function expectContainAll(received: unknown[], expected: unknown[]) {
        for (const item of expected) {
            expect(received).toContain(item);
        }
    }

    it('should set and get values', () => {
        setup(
            {
                key1: z.string(),
                key2: z.number(),
                key3: z.null(),
                key4: z.object({ nested: z.string() }),
                key5: zArrayWithKey(z.string(), item => item)
            },
            {
                key1: '',
                key2: 0,
                key3: null,
                key4: { nested: '' },
                key5: []
            }
        );

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
            setup(
                {
                    shared: z.object({
                        a: z.number(),
                        b: z.number()
                    })
                },
                {
                    shared: { a: 0, b: 0 }
                }
            );

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
            setup(
                {
                    shared: z.object({
                        a: z.number(),
                        b: z.number().optional(),
                        c: z.number().optional()
                    })
                },
                {
                    shared: { a: 0 }
                }
            );

            const obj = { a: 1 };
            crdt1.set('shared', obj);
            sync();

            crdt1.set('shared', { a: 1, b: 2 });
            crdt2.set('shared', { a: 1, c: 3 });

            sync();
            expect(crdt1.get('shared')).toEqual({ a: 1, b: 2, c: 3 });
            expect(crdt2.get('shared')).toEqual({ a: 1, b: 2, c: 3 });
        });

        it('should add and remove properties from the same object and merge', () => {
            setup(
                {
                    shared: z.object({
                        a: z.number(),
                        b: z.number().optional(),
                        c: z.number().optional()
                    })
                },
                {
                    shared: { a: 0 }
                }
            );

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
            setup(
                {
                    shared: zArrayWithKey(z.string(), item => item)
                },
                {
                    shared: []
                }
            );

            crdt1.set('shared', ['a', 'b', 'c']);
            sync();

            crdt1.set('shared', ['a', 'b', 'c', 'd']);
            crdt2.set('shared', ['a', 'b', 'c', 'e']);

            sync();
            expect(crdt1.get('shared')).toEqual(['a', 'b', 'c', 'd', 'e']);
            expect(crdt2.get('shared')).toEqual(['a', 'b', 'c', 'd', 'e']);
        });

        it('should remove items from arrays by id', () => {
            setup(
                {
                    shared: zArrayWithKey(z.string(), item => item)
                },
                {
                    shared: []
                }
            );

            crdt1.set('shared', ['a', 'b', 'c']);
            sync();

            crdt1.set('shared', ['a', 'b']);
            crdt2.set('shared', ['a', 'c']);

            sync();
            expect(crdt1.get('shared')).toEqual(['a']);
            expect(crdt2.get('shared')).toEqual(['a']);
        });

        it('should merge arrays by id with concurrent adds and removes', () => {
            setup(
                {
                    shared: zArrayWithKey(z.string(), item => item)
                },
                {
                    shared: []
                }
            );

            crdt1.set('shared', ['a', 'b', 'c']);
            sync();

            crdt1.set('shared', ['a', 'b', 'd']);
            crdt2.set('shared', ['a', 'c', 'e']);

            sync();
            expectContainAll(crdt1.get('shared') as unknown[], ['a', 'd', 'e']);
            expectContainAll(crdt2.get('shared') as unknown[], ['a', 'd', 'e']);
        });

        it('should deep merge arrays of objects by id', () => {
            setup(
                {
                    shared: zArrayWithKey(
                        z.object({
                            id: z.string(),
                            value: z.number()
                        }),
                        item => item.id
                    )
                },
                {
                    shared: []
                }
            );

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
            setup(
                {
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
                },
                {
                    meta: {
                        name: '',
                        icon: { type: 'emoji', value: '' }
                    }
                }
            );

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
            setup(
                {
                    items: z.union([
                        zArrayWithKey(
                            z.object({ id: z.string(), value: z.number() }),
                            item => item.id
                        ),
                        z.null()
                    ])
                },
                {
                    items: []
                }
            );

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
            setup(
                {
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
                },
                {
                    devices: {}
                }
            );

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
            setup(
                {
                    item: z.union([
                        z.object({
                            id: z.object({
                                type: z.literal('bip39'),
                                hash: z.string()
                            }),
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
                },
                {
                    item: {
                        id: { type: 'bip39', hash: '' },
                        meta: { name: '', icon: { type: 'emoji', value: '' } },
                        derivations: []
                    }
                }
            );

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
            setup(
                {
                    items: z.union([
                        zArrayWithKey(
                            z.object({ id: z.string(), value: z.number() }),
                            item => item.id
                        ),
                        z.null()
                    ])
                },
                {
                    items: []
                }
            );

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

    it('should set and get discriminated unions', () => {
        enum PortfolioType {
            BIP39 = 'BIP39',
            WATCH_ONLY = 'WATCH_ONLY'
        }

        enum WatchOnlySource {
            ADDRESS = 'ADDRESS',
            XPUB = 'XPUB'
        }
        enum PortfolioNetworkType {
            MAINNET = 'MAINNET',
            TESTNET = 'TESTNET'
        }
        const sPortfolioMetaIconEmoji = z.object({
            type: z.literal('emoji'),
            value: z.string()
        });

        const sPortfolioMetaIconColor = z.object({
            type: z.literal('color'),
            value: z.string()
        });

        const sPortfolioMetaIcon = z.union([sPortfolioMetaIconEmoji, sPortfolioMetaIconColor]);

        const sPortfolioMeta = z.object({
            name: z.string(),
            icon: sPortfolioMetaIcon
        });

        const sPortfolioSecretRevealedStatus = z.union([
            z.object({
                revealedAt: z.number(),
                revealedFromDevice: z.string()
            }),
            z.null()
        ]);
        enum BtcWalletType {
            NATIVE_SEGWIT = 'NATIVE_SEGWIT'
        }

        const sBtcAccountChainItem = z.object({
            wallets: zArrayWithKey(
                z.object({
                    type: z.enum(BtcWalletType)
                }),
                item => item.type
            ),
            xpub: z.string()
        });

        const sDerivationChains = z.object({
            btc: sBtcAccountChainItem
        });

        const sDerivation = z.object({
            index: z.number(),
            chains: sDerivationChains
        });
        enum VMType {
            BTC = 'BTC'
        }

        class PortfolioIdWatchOnly {
            constructor(
                public readonly identifier: string,
                public readonly source: WatchOnlySource,
                public readonly network: PortfolioNetworkType,
                public readonly vmType: VMType
            ) {}

            public toString(): string {
                return (
                    'portfolio' +
                    'watch-only' +
                    this.vmType +
                    this.source +
                    this.identifier +
                    this.network
                );
            }

            public toJSON(): {
                identifier: string;
                source: WatchOnlySource;
                networkType: PortfolioNetworkType;
                vmType: VMType;
            } {
                return {
                    identifier: this.identifier,
                    source: this.source,
                    networkType: this.network,
                    vmType: this.vmType
                };
            }
        }

        class PortfolioIdMnemonicBased {
            constructor(
                private readonly hash: string,
                public readonly network: PortfolioNetworkType
            ) {}

            public toString(): string {
                return 'portfolio' + 'seed' + this.hash + this.network;
            }

            public toJSON(): {
                hash: string;
                networkType: PortfolioNetworkType;
            } {
                return {
                    hash: this.hash,
                    networkType: this.network
                };
            }
        }

        const sPortfolioBip39 = z.object({
            id: z
                .object({
                    hash: z.string(),
                    networkType: z.enum(PortfolioNetworkType)
                })
                .transform(val => new PortfolioIdMnemonicBased(val.hash, val.networkType)),
            meta: sPortfolioMeta,
            type: z.literal(PortfolioType.BIP39),
            secretRevealedStatus: sPortfolioSecretRevealedStatus,
            encryptedSecret: sSecretEncrypted,
            derivations: zArrayWithKey(sDerivation, item => String(item.index))
        });

        const sPortfolioWatchOnly = z.object({
            id: z
                .object({
                    identifier: z.string(),
                    source: z.enum(WatchOnlySource),
                    networkType: z.enum(PortfolioNetworkType),
                    vmType: z.enum(VMType)
                })
                .transform(
                    val =>
                        new PortfolioIdWatchOnly(
                            val.identifier,
                            val.source,
                            val.networkType,
                            val.vmType
                        )
                ),
            meta: sPortfolioMeta,
            type: z.literal(PortfolioType.WATCH_ONLY),
            address: z.string(),
            xpub: z.string().nullable()
        });

        const sPortfolio = z.discriminatedUnion('type', [sPortfolioBip39, sPortfolioWatchOnly]);

        const sPortfolios = z.union([
            zArrayWithKey(sPortfolio, item => {
                if (item.type === PortfolioType.BIP39) {
                    return new PortfolioIdMnemonicBased(
                        item.id.hash,
                        item.id.networkType
                    ).toString();
                }
                return new PortfolioIdWatchOnly(
                    item.id.identifier,
                    item.id.source,
                    item.id.networkType,
                    item.id.vmType
                ).toString();
            }),
            z.null()
        ]);

        setup(
            {
                items: sPortfolios
            },
            {
                items: []
            }
        );

        const items = [
            {
                id: {
                    hash: 'abc123',
                    networkType: PortfolioNetworkType.MAINNET
                },
                meta: {
                    name: 'Wallet 1',
                    icon: { type: 'color', value: '#FF0000' }
                },
                type: PortfolioType.BIP39,
                secretRevealedStatus: null,
                encryptedSecret: 'encryptedSecret',
                derivations: [
                    {
                        index: 0,
                        chains: {
                            btc: {
                                wallets: [{ type: BtcWalletType.NATIVE_SEGWIT }],
                                xpub: 'xpub123'
                            }
                        }
                    }
                ]
            },
            {
                id: {
                    identifier: 'watch-only-1',
                    source: WatchOnlySource.ADDRESS,
                    networkType: PortfolioNetworkType.TESTNET,
                    vmType: VMType.BTC
                },
                meta: {
                    name: 'Watch Only 1',
                    icon: { type: 'emoji', value: '👀' }
                },
                type: PortfolioType.WATCH_ONLY,
                address: 'tb1qaddress',
                xpub: 'xpub456'
            }
        ];

        crdt1.set('items', items);

        expect(crdt1.get('items')).toEqual(items);
    });

    it('should check equality of CRDTs', () => {
        setup(
            {
                key: z.string()
            },
            {
                key: ''
            }
        );

        crdt1.set('key', 'value');
        sync();

        expect(crdt1.equals(crdt2)).toBe(true);

        crdt1.set('key', 'new value');
        expect(crdt1.equals(crdt2)).toBe(false);

        sync();
        expect(crdt1.equals(crdt2)).toBe(true);
    });

    it('should throw exception and do not apply any updates', () => {
        const schema = {
            value: z.object({
                key1: z.string(),
                key2: z.array(z.number())
            })
        };
        const versions = chainToRuntimeArray(
            defineVersionChain(
                defineStorageVersion({
                    version: 1,
                    schema,
                    migrate: _ => {
                        return {
                            value: {
                                key1: '',
                                key2: []
                            }
                        };
                    },
                    reverseMigrate: _ => {
                        return {};
                    }
                })
            )
        );
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

        crdt1 = YCRDT.create(doc, versions, 'device-1');

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
