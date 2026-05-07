import { describe, expect, it } from 'vitest';

import { createWalletStorage, insertDailyAddress, mustGet, readMainAccount } from './test-helpers';
import { getById, insert, orderedIds, remove, reorder, toOrderedSet } from '../../src';

describe('wallet storage example', () => {
    it('migrates a deep nested ordered set with projection', () => {
        const storage = createWalletStorage();
        const migratedAccount = readMainAccount(storage);
        const migratedAddress = getById(migratedAccount.chains.btc.addresses, 'addr-0')!;

        expect(migratedAddress.meta.derivation.source).toEqual({
            path: "m/84'/0'/0'/0/0",
            discoveredAtBlock: 0
        });
        expect(orderedIds(storage.read().portfolios)).toEqual(['portfolio-main']);
        expect(orderedIds(migratedAccount.chains.btc.addresses)).toEqual(['addr-0']);
    });

    it('writes and reads an inserted ordered-set item', () => {
        const storage = createWalletStorage();

        insertDailyAddress(storage);
        storage.update(draft => {
            draft.portfolios = insert(draft.portfolios, {
                id: 'portfolio-watch',
                name: 'Watch only',
                accounts: toOrderedSet([
                    {
                        id: 'btc-watch',
                        name: 'BTC watch',
                        chains: {
                            btc: {
                                xpub: 'xpub-watch',
                                addresses: toOrderedSet([
                                    {
                                        id: 'watch-0',
                                        label: 'Cold',
                                        address: 'bc1q-watch',
                                        meta: {
                                            derivation: {
                                                source: {
                                                    path: "m/84'/0'/1'/0/0",
                                                    discoveredAtBlock: 841_000
                                                }
                                            }
                                        }
                                    }
                                ])
                            }
                        }
                    }
                ])
            });
        });

        const updatedAccount = readMainAccount(storage);

        expect(orderedIds(updatedAccount.chains.btc.addresses)).toEqual(['addr-0', 'addr-1']);
        expect(
            getById(updatedAccount.chains.btc.addresses, 'addr-1')?.meta.derivation.source
                .discoveredAtBlock
        ).toBe(840_000);
        expect(getById(storage.read().portfolios, 'portfolio-watch')?.name).toBe('Watch only');
    });

    it('reorders an ordered-set item', () => {
        const storage = createWalletStorage();

        insertDailyAddress(storage);
        storage.update(draft => {
            const portfolio = mustGet(
                getById(draft.portfolios, 'portfolio-main'),
                'Portfolio was not migrated'
            );
            const account = mustGet(
                getById(portfolio.accounts, 'btc-main'),
                'Account was not migrated'
            );

            account.chains.btc.addresses = reorder(account.chains.btc.addresses, 'addr-1', 0);
        });

        expect(orderedIds(readMainAccount(storage).chains.btc.addresses)).toEqual([
            'addr-1',
            'addr-0'
        ]);
    });

    it('removes an ordered-set item', () => {
        const storage = createWalletStorage();

        insertDailyAddress(storage);

        storage.update(draft => {
            const portfolio = mustGet(
                getById(draft.portfolios, 'portfolio-main'),
                'Portfolio was not migrated'
            );
            const account = mustGet(
                getById(portfolio.accounts, 'btc-main'),
                'Account was not migrated'
            );

            account.chains.btc.addresses = remove(account.chains.btc.addresses, 'addr-0');
        });

        const prunedAccount = readMainAccount(storage);

        expect(getById(prunedAccount.chains.btc.addresses, 'addr-0')).toBeUndefined();
        expect(orderedIds(prunedAccount.chains.btc.addresses)).toEqual(['addr-1']);
    });
});
