import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import { createStorage, StorageVersion, hCons, hNil } from '@safely/slottree';

import { sSecretEncrypted, zArrayWithKey } from '../src';
import { YCRDT } from '../src/crdt/y-crdt';

describe('crdt', () => {
    type TestCRDT = YCRDT<Record<string, unknown>>;

    let crdt1: TestCRDT;
    let crdt2: TestCRDT;

    function setup(schema: z.ZodRawShape, initial: Record<string, unknown> = {}) {
        const peers = createPeers(schema, initial);
        crdt1 = peers.crdt1;
        crdt2 = peers.crdt2;
    }

    function createPeers(
        schema: z.ZodRawShape,
        initial: Record<string, unknown> = {}
    ): { crdt1: TestCRDT; crdt2: TestCRDT } {
        return {
            crdt1: createPeer('peer-1', schema, initial),
            crdt2: createPeer('peer-2', schema, initial)
        };
    }

    function createPeer(
        authorId: string,
        schema: z.ZodRawShape,
        initial: Record<string, unknown>
    ): TestCRDT {
        return new YCRDT(
            createStorage({
                authorId,
                versions: createVersions(schema, initial)
            })
        );
    }

    function createVersions(schema: z.ZodRawShape, initial: Record<string, unknown>) {
        const version: StorageVersion = {
            version: 1,
            schema: z.object(schema).partial(),
            initial,
            projectUp: (slot: Parameters<StorageVersion['projectUp']>[0]) => slot,
            projectDown: (slot: Parameters<StorageVersion['projectDown']>[0]) => slot
        };

        return hCons(version, hNil);
    }

    function sync(peer1 = crdt1, peer2 = crdt2) {
        const update1 = peer1.encodeAsSnapshot();
        const update2 = peer2.encodeAsSnapshot();

        peer1.applyUpdate(update2);
        peer2.applyUpdate(update1);
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
            key5: z.array(z.string())
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

        it('should transition from null to object value in union schema', () => {
            setup({
                meta: z.union([
                    z.object({
                        revealedAt: z.number(),
                        revealedFromDevice: z.string()
                    }),
                    z.null()
                ])
            });

            crdt1.set('meta', null);
            expect(crdt1.get('meta')).toBeNull();

            crdt1.set('meta', { revealedAt: 42, revealedFromDevice: 'iPhone' });
            expect(crdt1.get('meta')).toEqual({
                revealedAt: 42,
                revealedFromDevice: 'iPhone'
            });
        });

        it('should transition from null to object value nested in object', () => {
            setup({
                portfolio: z.object({
                    id: z.string(),
                    secretRevealedStatus: z.union([
                        z.object({
                            revealedAt: z.number(),
                            revealedFromDevice: z.string()
                        }),
                        z.null()
                    ])
                })
            });

            crdt1.set('portfolio', {
                id: 'p1',
                secretRevealedStatus: null
            });

            crdt1.set('portfolio', {
                id: 'p1',
                secretRevealedStatus: {
                    revealedAt: 42,
                    revealedFromDevice: 'iPhone'
                }
            });

            expect(crdt1.get('portfolio')).toEqual({
                id: 'p1',
                secretRevealedStatus: {
                    revealedAt: 42,
                    revealedFromDevice: 'iPhone'
                }
            });
        });

        it('should transition from null to array value in union schema', () => {
            setup({
                items: z.union([
                    zArrayWithKey(z.object({ id: z.string(), value: z.number() }), item => item.id),
                    z.null()
                ])
            });

            crdt1.set('items', null);
            expect(crdt1.get('items')).toBeNull();

            crdt1.set('items', [
                { id: 'a', value: 1 },
                { id: 'b', value: 2 }
            ]);
            expect(crdt1.get('items')).toEqual([
                { id: 'a', value: 1 },
                { id: 'b', value: 2 }
            ]);
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
                const portfolio = item as unknown as z.input<typeof sPortfolio>;

                if (portfolio.type === PortfolioType.BIP39) {
                    return new PortfolioIdMnemonicBased(
                        portfolio.id.hash,
                        portfolio.id.networkType
                    ).toString();
                }
                return new PortfolioIdWatchOnly(
                    portfolio.id.identifier,
                    portfolio.id.source,
                    portfolio.id.networkType,
                    portfolio.id.vmType
                ).toString();
            }),
            z.null()
        ]);

        setup({
            items: sPortfolios
        });

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
        setup({
            key: z.string()
        });

        crdt1.set('key', 'value');
        sync();

        expect(crdt1.equals(crdt2.encodeAsSnapshot().toString('utf8'))).toBe(true);

        crdt1.set('key', 'new value');
        expect(crdt1.equals(crdt2.encodeAsSnapshot().toString('utf8'))).toBe(false);

        sync();
        expect(crdt1.equals(crdt2.encodeAsSnapshot().toString('utf8'))).toBe(true);
    });
});
