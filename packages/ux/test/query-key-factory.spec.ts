import { describe, expect, it } from 'vitest';

import {
    defineQueryKeys,
    finalKey,
    mappedParams
} from '../src/shared/query-core/query-key-factory';

describe('defineQueryKeys', () => {
    describe('Simple nested structure', () => {
        it('should handle null and undefined parameters', () => {
            const rateKey = defineQueryKeys('rate', {
                asset: (_id: string, _address: string | null | undefined) => ({
                    fiat: (_fiatId: string) => ({
                        api: (_: string) => finalKey
                    })
                })
            });

            const key1 = rateKey.asset('btc', null).fiat('usd').api('api-key').toKey();
            expect(key1).toEqual(['rate', 'asset', 'btc', null, 'fiat', 'usd', 'api', 'api-key']);

            const key2 = rateKey.asset('btc', undefined).fiat('usd').api('api-key').toKey();
            expect(key2).toEqual(['rate', 'asset', 'btc', null, 'fiat', 'usd', 'api', 'api-key']);
        });
    });

    describe('finalKey terminal nodes', () => {
        it('should generate correct keys for finalKey', () => {
            const balanceKey = defineQueryKeys('balance', {
                wallet: (_address: string | null | undefined) => ({
                    ton: finalKey,
                    usdt: finalKey
                })
            });

            const walletKey = balanceKey.wallet('address123');
            const key1 = walletKey.ton.toKey();
            expect(key1).toEqual(['balance', 'wallet', 'address123', 'ton']);

            const key2 = walletKey.usdt.toKey();
            expect(key2).toEqual(['balance', 'wallet', 'address123', 'usdt']);
        });
    });

    describe('mappedParams', () => {
        interface KeeperId {
            accountId: string;
        }

        it('should transform parameters using paramsMapper', () => {
            const keeperIdKey = defineQueryKeys('keeperId', {
                accountId: mappedParams(
                    (_id: string | KeeperId | null) => {
                        return {
                            accountData: finalKey,
                            preferences: {
                                fiat: finalKey
                            }
                        };
                    },
                    (id: string | KeeperId | null) => [
                        id && typeof id === 'object' && 'accountId' in id ? id.accountId : id
                    ]
                )
            });

            const keeperId: KeeperId = { accountId: '123' };
            const accountKey1 = keeperIdKey.accountId(keeperId);
            const key1 = accountKey1.accountData.toKey();
            expect(key1).toEqual(['keeperId', 'accountId', '123', 'accountData']);

            const accountKey2 = keeperIdKey.accountId('456');
            const key2 = accountKey2.accountData.toKey();
            expect(key2).toEqual(['keeperId', 'accountId', '456', 'accountData']);

            const accountKey3 = keeperIdKey.accountId(null);
            const key3 = accountKey3.accountData.toKey();
            expect(key3).toEqual(['keeperId', 'accountId', null, 'accountData']);
        });

        it('should handle nested mappedParams', () => {
            const key = defineQueryKeys('test', {
                level1: mappedParams(
                    (_id: string) => {
                        return {
                            level2: mappedParams(
                                (_value: number) => finalKey,
                                (value: number) => [value.toString()]
                            )
                        };
                    },
                    (id: string) => [id]
                )
            });

            const result = key.level1('test-id').level2(42).toKey();
            expect(result).toEqual(['test', 'level1', 'test-id', 'level2', '42']);
        });
    });

    describe('Nested object structures', () => {
        it('should handle nested objects without functions', () => {
            const keeperIdStorageKey = defineQueryKeys('keeperId', {
                list: {
                    active: finalKey
                },
                accountId: (_id: string) => ({
                    accountData: finalKey
                })
            });

            const listKey = keeperIdStorageKey.list;
            const key1 = listKey.active.toKey();
            expect(key1).toEqual(['keeperId', 'list', 'active']);

            const accountKey = keeperIdStorageKey.accountId('123');
            const key2 = accountKey.accountData.toKey();
            expect(key2).toEqual(['keeperId', 'accountId', '123', 'accountData']);
        });
    });

    describe('Deeply nested calls', () => {
        it('should handle deeply nested function chains', () => {
            const groupsTotalRateKey = defineQueryKeys('groupsTotalRate', {
                address: (_address: string) => ({
                    api: (_api: string) => ({
                        fiat: (_fiat: string) => ({
                            date: (_date: string) => finalKey
                        })
                    })
                })
            });

            const key = groupsTotalRateKey
                .address('wallet-address')
                .api('api-key')
                .fiat('usd')
                .date('2024-01-01')
                .toKey();

            expect(key).toEqual([
                'groupsTotalRate',
                'address',
                'wallet-address',
                'api',
                'api-key',
                'fiat',
                'usd',
                'date',
                '2024-01-01'
            ]);
        });
    });

    describe('toKey() on function properties for cache invalidation', () => {
        it('should provide toKey() on function properties for cache invalidation', () => {
            const rateKey = defineQueryKeys('rate', {
                asset: (_id: string) => ({
                    fiat: (_fiatId: string) => ({
                        api: (_: string) => finalKey
                    })
                })
            });

            expect(rateKey.toKey()).toEqual(['rate']);
            expect(rateKey.asset.toKey()).toEqual(['rate', 'asset']);
        });

        it('should provide correct toKey() at all nesting levels', () => {
            const key = defineQueryKeys('test', {
                level1: (_id: string) => ({
                    level2: (_value: string) => ({
                        level3: finalKey
                    })
                })
            });

            expect(key.level1.toKey()).toEqual(['test', 'level1']);

            const level1 = key.level1('id1');

            expect(level1.level2.toKey()).toEqual(['test', 'level1', 'id1', 'level2']);
            expect(key.level1.toKey()).toEqual(['test', 'level1']);
        });
    });

    describe('key property', () => {
        it('should provide key property that matches toKey()', () => {
            const rateKey = defineQueryKeys('rate', {
                asset: (_id: string) => ({
                    fiat: (_fiatId: string) => ({
                        api: (_: string) => finalKey
                    })
                })
            });

            const result = rateKey.asset('btc').fiat('usd').api('api-key');
            expect(result.key).toEqual(result.toKey());
            expect(result.key).toEqual(['rate', 'asset', 'btc', 'fiat', 'usd', 'api', 'api-key']);
        });
    });

    describe('Object serialization', () => {
        it('should serialize objects with stable ordering', () => {
            const activityKey = defineQueryKeys('activity', {
                all: (
                    _wallets: { ton: string | null | undefined; btc: string | null | undefined },
                    _filters: { type?: string; date?: string }
                ) => finalKey
            });

            const wallets = { ton: 'ton-address', btc: 'btc-address' };
            const filters = { type: 'transfer', date: '2024-01-01' };
            const key = activityKey.all(wallets, filters).toKey();

            expect(key[0]).toBe('activity');
            expect(key[1]).toBe('all');
            expect(typeof key[2]).toBe('string');
            expect(typeof key[3]).toBe('string');

            const key2 = activityKey.all(wallets, filters).toKey();
            expect(key2).toEqual(key);
        });

        it('should handle complex nested objects', () => {
            const complexKey = defineQueryKeys('complex', {
                data: (_obj: { id: string; metadata: { version: number } }) => ({
                    process: (_config: { enabled: boolean; options: string[] }) => finalKey
                })
            });

            const obj = { id: '123', metadata: { version: 1 } };
            const config = { enabled: true, options: ['opt1', 'opt2'] };
            const key = complexKey.data(obj).process(config).toKey();

            expect(key[0]).toBe('complex');
            expect(key[1]).toBe('data');
            expect(typeof key[2]).toBe('string');
            expect(key[3]).toBe('process');
            expect(typeof key[4]).toBe('string');
        });
    });

    describe('Array parameters', () => {
        it('should handle array parameters', () => {
            const key = defineQueryKeys('test', {
                items: (_ids: string[]) => finalKey
            });

            const result = key.items(['id1', 'id2', 'id3']).toKey();
            expect(result).toEqual(['test', 'items', 'id1', 'id2', 'id3']);
        });

        it('should handle empty arrays', () => {
            const key = defineQueryKeys('test', {
                items: (_ids: string[]) => finalKey
            });

            const result = key.items([]).toKey();
            expect(result).toEqual(['test', 'items']);
        });
    });

    describe('Method syntax', () => {
        it('should support method syntax in addition to arrow functions', () => {
            const bootConfigKey = defineQueryKeys('bootConfig', {
                api(_: string) {
                    return finalKey;
                }
            });

            const key = bootConfigKey.api('api-key').toKey();
            expect(key).toEqual(['bootConfig', 'api', 'api-key']);
        });
    });

    describe('Multiple parameters', () => {
        it('should handle functions with multiple parameters', () => {
            const key = defineQueryKeys('test', {
                multi: (_param1: string, _param2: number, _param3: boolean) => finalKey
            });

            const result = key.multi('str', 42, true).toKey();
            expect(result).toEqual(['test', 'multi', 'str', 42, true]);
        });
    });

    describe('Edge cases', () => {
        it('should handle empty domain with definition', () => {
            const key = defineQueryKeys('test', {});
            expect(key.toKey()).toEqual(['test']);
        });

        it('should handle boolean and number primitives', () => {
            const key = defineQueryKeys('test', {
                flag: (_enabled: boolean) => finalKey,
                count: (_value: number) => finalKey
            });

            expect(key.flag(true).toKey()).toEqual(['test', 'flag', true]);
            expect(key.flag(false).toKey()).toEqual(['test', 'flag', false]);
            expect(key.count(42).toKey()).toEqual(['test', 'count', 42]);
            expect(key.count(0).toKey()).toEqual(['test', 'count', 0]);
        });

        it('should handle null and undefined consistently', () => {
            const key = defineQueryKeys('test', {
                value: (_val: string | null | undefined) => finalKey
            });

            expect(key.value(null).toKey()).toEqual(['test', 'value', null]);
            expect(key.value(undefined).toKey()).toEqual(['test', 'value', null]);
        });
    });

    describe('Real-world scenarios', () => {
        it('should match the actual keys.ts usage patterns', () => {
            const rateKey = defineQueryKeys('rate', {
                asset: (_id: string, _address: string | null | undefined) => ({
                    fiat: (_fiatId: string) => ({
                        api: (_: string) => finalKey
                    })
                })
            });

            const key = rateKey.asset('btc', 'address123').fiat('usd').api('api-key').toKey();

            expect(key).toEqual([
                'rate',
                'asset',
                'btc',
                'address123',
                'fiat',
                'usd',
                'api',
                'api-key'
            ]);
        });

        it('should match the activity key pattern', () => {
            const activityKey = defineQueryKeys('activity', {
                all: (
                    _wallets: { ton: string | null | undefined; btc: string | null | undefined },
                    _filters: { type?: string }
                ) => finalKey,
                token: (
                    _wallets: { ton: string | null | undefined; btc: string | null | undefined },
                    _tokenAddress: string,
                    _filters: { type?: string }
                ) => finalKey
            });

            const wallets = { ton: 'ton-addr', btc: 'btc-addr' };
            const filters = { type: 'transfer' };

            const key1 = activityKey.all(wallets, filters).toKey();
            expect(key1[0]).toBe('activity');
            expect(key1[1]).toBe('all');

            const key2 = activityKey.token(wallets, 'token-addr', filters).toKey();
            expect(key2[0]).toBe('activity');
            expect(key2[1]).toBe('token');
        });

        it('should match the keeperId key pattern with mappedParams', () => {
            interface KeeperId {
                accountId: string;
            }

            const keeperIdStorageKey = defineQueryKeys('keeperId', {
                list: {
                    active: finalKey
                },
                accountId: mappedParams(
                    (_id: string | KeeperId | null) => {
                        return {
                            keeperIdAccountData: finalKey,
                            preferredFiat: {
                                deps: mappedParams(
                                    (_: { availableFiats: Array<{ id: string }> }) => finalKey,
                                    (p: { availableFiats: Array<{ id: string }> }) => [
                                        {
                                            availableFiats: p.availableFiats.map(a =>
                                                a.id.toString()
                                            )
                                        }
                                    ]
                                )
                            },
                            accounts: {
                                active: finalKey
                            }
                        };
                    },
                    (id: string | KeeperId | null) => [
                        id && typeof id === 'object' && 'accountId' in id ? id.accountId : id
                    ]
                )
            });

            const listKey = keeperIdStorageKey.list;
            const key1 = listKey.active.toKey();
            expect(key1).toEqual(['keeperId', 'list', 'active']);

            const keeperId: KeeperId = { accountId: '123' };
            const accountKey = keeperIdStorageKey.accountId(keeperId);
            const key2 = accountKey.keeperIdAccountData.toKey();
            expect(key2).toEqual(['keeperId', 'accountId', '123', 'keeperIdAccountData']);

            const preferredFiatKey = accountKey.preferredFiat.deps({
                availableFiats: [{ id: 'usd' }, { id: 'eur' }]
            });
            const key3 = preferredFiatKey.toKey();
            expect(key3[0]).toBe('keeperId');
            expect(key3[1]).toBe('accountId');
            expect(key3[2]).toBe('123');
            expect(key3[3]).toBe('preferredFiat');
            expect(key3[4]).toBe('deps');
        });
    });
});
