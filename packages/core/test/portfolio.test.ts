import { generateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';
import { beforeEach, describe, expect, it } from 'vitest';

import type { SPortfolioBip39, SPortfolioBip39IdImported } from '@safely/sync-storage';
import { ArraySchemaIdKey, sPortfolio } from '@safely/sync-storage';

import type { PortfolioBip39 } from '../src';
import {
    BtcNetwork,
    BtcWalletType,
    BtcXpub,
    InvalidMnemonicError,
    PortfolioFactory,
    PortfolioNetworkType,
    PortfolioType,
    VM_TYPE,
    WatchOnlySource
} from '../src';
import { ClosableMnemonicAccessorVault, MockSecretEncryptor } from './utils/mocks';
import { BtcAddress } from '../src/blockchain-api/btc/btc-address';

describe('Test portfolio generation (Bitcoin)', () => {
    let encryptor: MockSecretEncryptor;
    let portfolioFactory: PortfolioFactory;

    beforeEach(() => {
        encryptor = new MockSecretEncryptor();
        portfolioFactory = new PortfolioFactory(encryptor);
    });

    it('Should generate correct btc address for bip39 mnemonic (testnet)', async () => {
        const testMnemonic =
            'friend north art fix rail decorate nominee oil script physical ordinary panic'.split(
                ' '
            );
        const portfolioName = 'Portfolio 1';

        const portfolio = await portfolioFactory.generatePortfolio(
            new ClosableMnemonicAccessorVault(testMnemonic),
            {
                network: PortfolioNetworkType.TESTNET,
                meta: { name: portfolioName }
            }
        );

        expect(portfolio).not.toBeNull();
        expect(portfolio.meta.name).toEqual(portfolioName);
        expect(portfolio.type).toBe(PortfolioType.BIP39);
        expect(portfolio.id.network).toBe(PortfolioNetworkType.TESTNET);
        expect(portfolio.type).toBe(PortfolioType.BIP39);
        expect(portfolio.networkType).toBe(PortfolioNetworkType.TESTNET);
        expect(portfolio.derivations[0].chains.btc.network).toBe(BtcNetwork.TESTNET);
        expect(portfolio.derivations[0].chains.btc.wallets.length).toBe(1);
        expect(portfolio.derivations[0].chains.btc.wallets[0].address).toBe(
            'tb1q4tvt7x6veyr96kj3deph5av03czytyw5ssalr6'
        );

        expect(encryptor.decrypt).toHaveBeenCalledTimes(0);
    });

    it('Should serialize and deserialize portfolio bip39', async () => {
        const testMnemonic =
            'firm idle yellow accuse lizard dial labor cushion blade voice spy impact'.split(' ');
        const portfolioName = 'Portfolio 1';

        const portfolio = await portfolioFactory.generatePortfolio(
            new ClosableMnemonicAccessorVault(testMnemonic),
            {
                network: PortfolioNetworkType.MAINNET,
                meta: { name: portfolioName }
            }
        );

        expect(portfolio).not.toBeNull();

        const serialized = JSON.stringify(portfolio);
        const parsed: unknown = JSON.parse(serialized);

        const expectedStructure: SPortfolioBip39 = {
            id: {
                hash: portfolio.id.toJSON().hash,
                networkType: PortfolioNetworkType.MAINNET
            },
            type: PortfolioType.BIP39,
            meta: {
                name: portfolioName,
                icon: portfolio.meta.icon
            },
            secretRevealedStatus: null,
            derivations: [
                {
                    index: 0,
                    chains: {
                        btc: {
                            xpub: portfolio.derivations[0].chains.btc.xpub,
                            wallets: [
                                {
                                    type: BtcWalletType.NATIVE_SEGWIT
                                }
                            ]
                        }
                    }
                }
            ],
            encryptedSecret: portfolio.toJSON().encryptedSecret
        };

        expect(parsed).toMatchObject({
            id: { networkType: PortfolioNetworkType.MAINNET },
            type: PortfolioType.BIP39,
            meta: { name: portfolioName },
            derivations: [
                {
                    index: 0,
                    chains: {
                        btc: {
                            wallets: [{ type: BtcWalletType.NATIVE_SEGWIT }]
                        }
                    }
                }
            ]
        });

        const portfolioRestored = PortfolioFactory.restorePortfolio(
            encryptor,
            sPortfolio.parse(expectedStructure)
        ) as PortfolioBip39;
        expect(portfolioRestored.type).toBe(PortfolioType.BIP39);
        expect(portfolioRestored.derivations[0].chains.btc.wallets[0].address).toBe(
            portfolio.derivations[0].chains.btc.wallets[0].address
        );
    });

    it('Should serialize and deserialize portfolio bip39 revealed', async () => {
        const testMnemonic =
            'firm idle yellow accuse lizard dial labor cushion blade voice spy impact'.split(' ');
        const portfolioName = 'Portfolio 1';

        const portfolio = await portfolioFactory.generatePortfolio(
            new ClosableMnemonicAccessorVault(testMnemonic),
            {
                network: PortfolioNetworkType.MAINNET,
                meta: { name: portfolioName },
                seedRevealedFromDevice: 'TEST_DEVICE_NAME'
            }
        );

        expect(portfolio).not.toBeNull();

        const serialized = JSON.stringify(portfolio);
        const parsed: unknown = JSON.parse(serialized);

        const expectedStructure: SPortfolioBip39 = {
            id: {
                hash: portfolio.id.toJSON().hash,
                networkType: PortfolioNetworkType.MAINNET
            },
            type: PortfolioType.BIP39,
            meta: {
                name: portfolioName,
                icon: portfolio.meta.icon
            },
            secretRevealedStatus: {
                revealedAt: portfolio.secretRevealedStatus!.revealedAt.getTime(),
                revealedFromDevice: 'TEST_DEVICE_NAME'
            },
            derivations: [
                {
                    index: 0,
                    chains: {
                        btc: {
                            xpub: portfolio.derivations[0].chains.btc.xpub,
                            wallets: [
                                {
                                    type: BtcWalletType.NATIVE_SEGWIT
                                }
                            ]
                        }
                    }
                }
            ],
            encryptedSecret: portfolio.toJSON().encryptedSecret
        };

        expect(parsed).toMatchObject({
            id: { networkType: PortfolioNetworkType.MAINNET },
            type: PortfolioType.BIP39,
            meta: { name: portfolioName },
            secretRevealedStatus: { revealedFromDevice: 'TEST_DEVICE_NAME' },
            derivations: [
                {
                    index: 0,
                    chains: {
                        btc: {
                            wallets: [{ type: BtcWalletType.NATIVE_SEGWIT }]
                        }
                    }
                }
            ]
        });

        const portfolioRestored = PortfolioFactory.restorePortfolio(
            encryptor,
            sPortfolio.parse(expectedStructure)
        ) as PortfolioBip39;
        expect(portfolioRestored.type).toBe(PortfolioType.BIP39);
        expect(portfolioRestored.derivations[0].chains.btc.wallets[0].address).toBe(
            portfolio.derivations[0].chains.btc.wallets[0].address
        );
    });

    it('Valid BTC address is generated', async () => {
        const testMnemonic =
            'ivory trouble wheat next depart dove choice easily enroll suffer lawsuit lend'.split(
                ' '
            );
        const portfolioName = 'BTC Portfolio';
        const portfolio = await portfolioFactory.generatePortfolio(
            new ClosableMnemonicAccessorVault(testMnemonic),
            {
                network: PortfolioNetworkType.MAINNET,
                meta: { name: portfolioName }
            }
        );

        expect(portfolio).not.toBeNull();
        expect(portfolio.meta.name).toEqual(portfolioName);
        expect(portfolio.type).toBe(PortfolioType.BIP39);
        expect(portfolio.id.network).toBe(PortfolioNetworkType.MAINNET);
        expect(portfolio.type).toBe(PortfolioType.BIP39);
        expect(portfolio.networkType).toBe(PortfolioNetworkType.MAINNET);

        expect(portfolio.derivations[0].chains.btc.wallets[0].address.startsWith('bc1')).toBe(true);
        expect(portfolio.derivations[0].chains.btc.wallets[0].address.length).toBeGreaterThan(10);

        expect(portfolio.derivations[0].chains.btc.network).toBe(BtcNetwork.MAINNET);
        expect(portfolio.derivations[0].chains.btc.wallets.length).toBe(1);
        expect(portfolio.derivations[0].chains.btc.wallets[0].type).toBe(
            BtcWalletType.NATIVE_SEGWIT
        );

        const btcAddress = portfolio.derivations[0].chains.btc.wallets[0].address;
        expect(btcAddress.startsWith('bc1')).toBe(true);
        expect(btcAddress.length).toBeGreaterThanOrEqual(42);
        expect(btcAddress.length).toBeLessThanOrEqual(62);

        expect(portfolio.derivations[0].chains.btc.xpub).toBeDefined();
        expect(portfolio.derivations[0].chains.btc.xpub).toMatch(/^xpub/);
        expect(portfolio.derivations[0].chains.btc.xpub.length).toBeGreaterThan(100);

        expect(encryptor.decrypt).toHaveBeenCalledTimes(0);
    });
});

describe('Extended tests for portfolio operations (Bitcoin)', () => {
    let encryptor: MockSecretEncryptor;
    let portfolioFactory: PortfolioFactory;

    beforeEach(() => {
        encryptor = new MockSecretEncryptor();
        portfolioFactory = new PortfolioFactory(encryptor);
    });

    describe('Portfolio ID consistency', () => {
        it('Should generate same portfolio id for same mnemonic and network', async () => {
            const mnemonic =
                'friend north art fix rail decorate nominee oil script physical ordinary panic'.split(
                    ' '
                );
            const portfolioName1 = 'Portfolio 1';
            const portfolioName2 = 'Another Portfolio';

            const portfolio1 = await portfolioFactory.generatePortfolio(
                new ClosableMnemonicAccessorVault(mnemonic),
                {
                    network: PortfolioNetworkType.TESTNET,
                    meta: { name: portfolioName1 }
                }
            );

            const portfolio2 = await portfolioFactory.generatePortfolio(
                new ClosableMnemonicAccessorVault(mnemonic),
                {
                    network: PortfolioNetworkType.TESTNET,
                    meta: { name: portfolioName2 }
                }
            );

            expect(portfolio1).not.toBeNull();
            expect(portfolio2).not.toBeNull();

            expect((portfolio1.id.toJSON() as SPortfolioBip39IdImported).seedHash).toEqual(
                (portfolio2.id.toJSON() as SPortfolioBip39IdImported).seedHash
            );
            expect(portfolio1.type).toBe(PortfolioType.BIP39);
            expect(portfolio2.type).toBe(PortfolioType.BIP39);
            expect(portfolio1.id.network).toBe(PortfolioNetworkType.TESTNET);
            expect(portfolio2.id.network).toBe(PortfolioNetworkType.TESTNET);
            expect(portfolio1.derivations[0].chains.btc.network).toBe(BtcNetwork.TESTNET);
            expect(portfolio2.derivations[0].chains.btc.network).toBe(BtcNetwork.TESTNET);
        });

        it('Should generate different portfolio id for different networks', async () => {
            const mnemonic =
                'friend north art fix rail decorate nominee oil script physical ordinary panic'.split(
                    ' '
                );
            const portfolioName = 'Portfolio 1';

            const portfolioMainnet = await portfolioFactory.generatePortfolio(
                new ClosableMnemonicAccessorVault(mnemonic),
                {
                    network: PortfolioNetworkType.MAINNET,
                    meta: { name: portfolioName }
                }
            );

            const portfolioTestnet = await portfolioFactory.generatePortfolio(
                new ClosableMnemonicAccessorVault(mnemonic),
                {
                    network: PortfolioNetworkType.TESTNET,
                    meta: { name: portfolioName }
                }
            );

            expect(portfolioMainnet).not.toBeNull();
            expect(portfolioTestnet).not.toBeNull();

            expect(portfolioMainnet.id.network).toBe(PortfolioNetworkType.MAINNET);
            expect(portfolioTestnet.id.network).toBe(PortfolioNetworkType.TESTNET);

            expect(portfolioMainnet.derivations[0].chains.btc.network).toBe(BtcNetwork.MAINNET);
            expect(portfolioTestnet.derivations[0].chains.btc.network).toBe(BtcNetwork.TESTNET);

            expect(portfolioMainnet.type).toBe(PortfolioType.BIP39);
            expect(portfolioTestnet.type).toBe(PortfolioType.BIP39);
        });
    });

    describe('Address consistency', () => {
        it('Should generate same BTC address for same mnemonic and network', async () => {
            const mnemonic =
                'friend north art fix rail decorate nominee oil script physical ordinary panic'.split(
                    ' '
                );
            const portfolioName = 'Portfolio 1';

            const portfolio1 = await portfolioFactory.generatePortfolio(
                new ClosableMnemonicAccessorVault(mnemonic),
                {
                    network: PortfolioNetworkType.MAINNET,
                    meta: { name: portfolioName }
                }
            );

            const portfolio2 = await portfolioFactory.generatePortfolio(
                new ClosableMnemonicAccessorVault(mnemonic),
                {
                    network: PortfolioNetworkType.MAINNET,
                    meta: { name: portfolioName }
                }
            );

            expect(portfolio1).not.toBeNull();
            expect(portfolio2).not.toBeNull();

            expect(portfolio1.derivations[0].chains.btc.wallets[0].address).toBe(
                portfolio2.derivations[0].chains.btc.wallets[0].address
            );

            expect(portfolio1.derivations[0].chains.btc.xpub).toBe(
                portfolio2.derivations[0].chains.btc.xpub
            );

            expect(encryptor.decrypt).toHaveBeenCalledTimes(0);
        });
    });

    it('Should not allow removing last derivation', async () => {
        const mnemonic =
            'friend north art fix rail decorate nominee oil script physical ordinary panic'.split(
                ' '
            );
        const portfolioName = 'Portfolio 1';

        const portfolio = await portfolioFactory.generatePortfolio(
            new ClosableMnemonicAccessorVault(mnemonic),
            {
                network: PortfolioNetworkType.TESTNET,
                meta: { name: portfolioName }
            }
        );

        expect(portfolio).not.toBeNull();

        expect(() => {
            portfolio.removeDerivation(0);
        }).toThrow();

        expect(portfolio.derivations.length).toBe(1);
        expect(portfolio.derivations[0].chains.btc.network).toBe(BtcNetwork.TESTNET);
    });

    it('Should restore btc Testnet portfolio from stored structure', async () => {
        const mnemonic =
            'ivory trouble wheat next depart dove choice easily enroll suffer lawsuit lend'.split(
                ' '
            );
        const portfolioName = 'BTC Testnet Portfolio';

        const portfolio = await portfolioFactory.generatePortfolio(
            new ClosableMnemonicAccessorVault(mnemonic),
            {
                network: PortfolioNetworkType.TESTNET,
                meta: { name: portfolioName }
            }
        );

        expect(portfolio).not.toBeNull();
        expect(portfolio.meta.name).toEqual(portfolioName);
        expect(portfolio.type).toBe(PortfolioType.BIP39);
        expect(portfolio.id.network).toBe(PortfolioNetworkType.TESTNET);
        expect(portfolio.type).toBe(PortfolioType.BIP39);
        expect(portfolio.networkType).toBe(PortfolioNetworkType.TESTNET);
        expect(portfolio.derivations[0].chains.btc.network).toBe(BtcNetwork.TESTNET);
        expect(portfolio.derivations[0].chains.btc.wallets.length).toBe(1);

        const storedPortfolio: SPortfolioBip39 = {
            type: PortfolioType.BIP39,
            id: portfolio.id.toJSON(),
            meta: {
                name: portfolio.meta.name,
                icon: portfolio.meta.icon
            },
            secretRevealedStatus: portfolio.secretRevealedStatus
                ? {
                      revealedAt: portfolio.secretRevealedStatus.revealedAt.getTime(),
                      revealedFromDevice: portfolio.secretRevealedStatus.revealedFromDevice
                  }
                : null,
            derivations: portfolio.derivations.map(d => ({
                index: d.index,
                chains: {
                    btc: {
                        xpub: d.chains.btc.xpub
                    }
                },
                [ArraySchemaIdKey]: d.id.toString()
            })),
            encryptedSecret: portfolio.toJSON().encryptedSecret
        };

        const portfolioRestored = PortfolioFactory.restorePortfolio(
            encryptor,
            sPortfolio.parse(storedPortfolio)
        ) as PortfolioBip39;

        expect(portfolioRestored.type).toBe(PortfolioType.BIP39);
        expect(portfolioRestored.id.network).toBe(PortfolioNetworkType.TESTNET);
        expect(portfolioRestored.networkType).toBe(PortfolioNetworkType.TESTNET);
        expect(portfolioRestored.meta.name).toEqual(portfolioName);

        expect(portfolioRestored.derivations[0].chains.btc.network).toBe(BtcNetwork.TESTNET);
        expect(portfolioRestored.derivations[0].chains.btc.wallets[0].address).toBe(
            portfolio.derivations[0].chains.btc.wallets[0].address
        );
        expect(portfolioRestored.derivations[0].chains.btc.xpub).toBe(
            portfolio.derivations[0].chains.btc.xpub
        );
        expect(portfolioRestored.derivations[0].chains.btc.wallets[0].type).toBe(
            portfolio.derivations[0].chains.btc.wallets[0].type
        );

        expect(encryptor.decrypt).toHaveBeenCalledTimes(0);
    });
});

describe('Negative scenarios (Bitcoin)', () => {
    let encryptor: MockSecretEncryptor;
    let portfolioFactory: PortfolioFactory;

    beforeEach(() => {
        encryptor = new MockSecretEncryptor();
        portfolioFactory = new PortfolioFactory(encryptor);
    });

    it('rejects BIP39 mnemonic polluted with symbols and prevents BTC wallet derivation', async () => {
        const invalidMnemonic = [
            'north!',
            'art@',
            'fix#',
            'rail$',
            'decorate%',
            'nominee^',
            'oil&',
            'script*',
            'physical(',
            'ordinary)',
            'panic_',
            'extra?'
        ];
        const portfolioName = 'Invalid Portfolio';

        await expect(
            portfolioFactory.generatePortfolio(new ClosableMnemonicAccessorVault(invalidMnemonic), {
                network: PortfolioNetworkType.MAINNET,
                meta: { name: portfolioName }
            })
        ).rejects.toThrow(InvalidMnemonicError);
        expect(encryptor.decrypt).toHaveBeenCalledTimes(0);
    });

    it('rejects shortened mnemonic and produces no portfolio', async () => {
        const invalidMnemonic =
            'wonder enlist rival minute truck melody area person regret foam whip night'.split(' ');
        const portfolioName = 'Short mnemonic';

        await expect(
            portfolioFactory.generatePortfolio(new ClosableMnemonicAccessorVault(invalidMnemonic), {
                network: PortfolioNetworkType.MAINNET,
                meta: { name: portfolioName }
            })
        ).rejects.toThrow(InvalidMnemonicError);
        expect(encryptor.decrypt).toHaveBeenCalledTimes(0);
    });

    it('rejects BIP39 mnemonic with wrong checksum', async () => {
        const invalidMnemonic =
            'ivory trouble wheat next depart dove choice easily enroll suffer lawsuit lens'.split(
                ' '
            );

        expect(invalidMnemonic.length).toBe(12);

        const portfolioName = 'Checksum mismatch';

        await expect(
            portfolioFactory.generatePortfolio(new ClosableMnemonicAccessorVault(invalidMnemonic), {
                network: PortfolioNetworkType.MAINNET,
                meta: { name: portfolioName }
            })
        ).rejects.toThrow(InvalidMnemonicError);
        expect(encryptor.decrypt).toHaveBeenCalledTimes(0);
    });

    it('Should fail with empty mnemonic', async () => {
        const invalidMnemonic: string[] = [];
        const portfolioName = 'Empty Mnemonic';

        await expect(
            portfolioFactory.generatePortfolio(new ClosableMnemonicAccessorVault(invalidMnemonic), {
                network: PortfolioNetworkType.MAINNET,
                meta: { name: portfolioName }
            })
        ).rejects.toThrow(InvalidMnemonicError);
        expect(encryptor.decrypt).toHaveBeenCalledTimes(0);
    });

    it('Should fail with too short mnemonic (5 words)', async () => {
        const invalidMnemonic = 'apple banana cherry date elder'.split(' ');
        const portfolioName = 'Short mnemonic';

        await expect(
            portfolioFactory.generatePortfolio(new ClosableMnemonicAccessorVault(invalidMnemonic), {
                network: PortfolioNetworkType.MAINNET,
                meta: { name: portfolioName }
            })
        ).rejects.toThrow(InvalidMnemonicError);
        expect(encryptor.decrypt).toHaveBeenCalledTimes(0);
    });

    it('Should fail with too long mnemonic (30 words)', async () => {
        const invalidMnemonic = Array(30).fill('word') as string[];
        const portfolioName = 'Too long mnemonic';

        await expect(
            portfolioFactory.generatePortfolio(new ClosableMnemonicAccessorVault(invalidMnemonic), {
                network: PortfolioNetworkType.MAINNET,
                meta: { name: portfolioName }
            })
        ).rejects.toThrow(InvalidMnemonicError);
        expect(encryptor.decrypt).toHaveBeenCalledTimes(0);
    });

    it('Should fail when mnemonic has duplicate words beyond allowed entropy', async () => {
        const invalidMnemonic =
            'apple apple apple apple apple apple apple apple apple apple apple apple'.split(' ');
        const portfolioName = 'Duplicates';

        await expect(
            portfolioFactory.generatePortfolio(new ClosableMnemonicAccessorVault(invalidMnemonic), {
                network: PortfolioNetworkType.MAINNET,
                meta: { name: portfolioName }
            })
        ).rejects.toThrow(InvalidMnemonicError);
        expect(encryptor.decrypt).toHaveBeenCalledTimes(0);
    });

    it('Should handle valid mnemonic and derive BTC address', async () => {
        const validMnemonic =
            'ivory trouble wheat next depart dove choice easily enroll suffer lawsuit lend'.split(
                ' '
            );
        const portfolioName = 'BTCAddressSuccess';

        const portfolio = await portfolioFactory.generatePortfolio(
            new ClosableMnemonicAccessorVault(validMnemonic),
            {
                network: PortfolioNetworkType.MAINNET,
                meta: { name: portfolioName }
            }
        );

        expect(portfolio).not.toBeNull();
        const btcAddress = portfolio.derivations[0].chains.btc.wallets[0].address;
        expect(btcAddress).toBeDefined();
        expect(btcAddress).not.toBeNull();
        expect(btcAddress.startsWith('bc1')).toBe(true);
    });

    describe('Create new wallet', () => {
        it('should successfully create a new wallet and derive valid BTC mainnet address', async () => {
            const mnemonic = generateMnemonic(wordlist, 128).split(' ');
            const accessor = new ClosableMnemonicAccessorVault(mnemonic);
            const name = 'New Wallet';

            const portfolio = await portfolioFactory.generatePortfolioBip39(accessor, {
                network: PortfolioNetworkType.MAINNET,
                meta: { name }
            });

            // Портфолио успешно создано
            expect(portfolio).not.toBeNull();
            // Проверка метаданных: имя кошелька
            expect(portfolio.meta.name).toBe(name);
            // Тип портфолио — BIP39, сеть — mainnet
            expect(portfolio.type).toBe(PortfolioType.BIP39);
            expect(portfolio.id.network).toBe(PortfolioNetworkType.MAINNET);
            expect(portfolio.type).toBe(PortfolioType.BIP39);
            expect(portfolio.networkType).toBe(PortfolioNetworkType.MAINNET);
            // Один derivation, один BTC-кошелёк в нём
            expect(portfolio.derivations).toHaveLength(1);
            expect(portfolio.derivations[0].chains.btc.wallets).toHaveLength(1);

            const btcWallet = portfolio.derivations[0].chains.btc.wallets[0];
            // Адрес сгенерирован и в формате SegWit (bc1…)
            expect(btcWallet.address).toBeDefined();
            expect(btcWallet.address.startsWith('bc1')).toBe(true);
            // Тип кошелька — Native SegWit
            expect(btcWallet.type).toBe(BtcWalletType.NATIVE_SEGWIT);
            expect(portfolio.derivations[0].chains.btc.network).toBe(BtcNetwork.MAINNET);

            // Сериализация в JSON сохраняет тип и имя
            const serialized = portfolio.toJSON();
            expect(serialized.type).toBe(PortfolioType.BIP39);
            expect(serialized.meta.name).toBe(name);
        });
    });

    describe('Add existing wallet (import by mnemonic)', () => {
        it('should successfully import existing wallet from mnemonic and match expected address', async () => {
            const IMPORT_EXISTING_MNEMONIC = [
                'ivory',
                'trouble',
                'wheat',
                'next',
                'depart',
                'dove',
                'choice',
                'easily',
                'enroll',
                'suffer',
                'lawsuit',
                'lend'
            ];

            const name = 'Imported Wallet';
            const accessor = new ClosableMnemonicAccessorVault(IMPORT_EXISTING_MNEMONIC);

            const portfolio = await portfolioFactory.generatePortfolio(accessor, {
                network: PortfolioNetworkType.MAINNET,
                meta: { name }
            });

            // Импорт прошёл успешно
            expect(portfolio).not.toBeNull();
            // Имя задано корректно
            expect(portfolio.meta.name).toBe(name);
            // Тип BIP39, сеть mainnet
            expect(portfolio.type).toBe(PortfolioType.BIP39);
            expect(portfolio.id.network).toBe(PortfolioNetworkType.MAINNET);
            expect(portfolio.derivations[0].chains.btc.network).toBe(BtcNetwork.MAINNET);
            // Кошелёк — Native SegWit
            expect(portfolio.derivations[0].chains.btc.wallets[0].type).toBe(
                BtcWalletType.NATIVE_SEGWIT
            );

            const address = portfolio.derivations[0].chains.btc.wallets[0].address;
            // Адрес есть, формат bc1…, длина в допустимых границах для bech32
            expect(address).toBeDefined();
            expect(address.startsWith('bc1')).toBe(true);
            expect(address.length).toBeGreaterThanOrEqual(42);
            expect(address.length).toBeLessThanOrEqual(62);

            // Расширенный публичный ключ (xpub) присутствует и в ожидаемом формате
            expect(portfolio.derivations[0].chains.btc.xpub).toBeDefined();
            expect(portfolio.derivations[0].chains.btc.xpub).toMatch(/^xpub/);

            // Восстановление из сохранённого состояния: адрес совпадает с исходным
            const restored = PortfolioFactory.restorePortfolio(
                encryptor,
                sPortfolio.parse(portfolio.toJSON())
            ) as PortfolioBip39;
            expect(restored.derivations[0].chains.btc.wallets[0].address).toBe(address);
        });

        it('should accept valid watch-only Bitcoin address (SegWit) for future watch-only flow', () => {
            const address = 'bc1qcleg3jtmvlar6cgm24vpq6n8ew3d0hame0av83';

            const type = BtcAddress.type(address);
            expect(type).toBe('P2WPKH');
            expect(BtcAddress.isSegWit(address)).toBe(true);
            expect(address.startsWith('bc1q')).toBe(true);
            expect(address.length).toBeGreaterThanOrEqual(42);
            expect(address.length).toBeLessThanOrEqual(62);
        });
    });

    describe('Watch-only portfolio', () => {
        const testAddress = 'bc1qcleg3jtmvlar6cgm24vpq6n8ew3d0hame0av83';
        const testMeta = { name: 'Watch Wallet', icon: { type: 'emoji' as const, value: '👀' } };

        it('should create watch-only portfolio from address', () => {
            const portfolio = PortfolioFactory.generateWatchOnlyPortfolio(testAddress, {
                network: PortfolioNetworkType.MAINNET,
                meta: testMeta,
                vmType: VM_TYPE.BTC
            });

            expect(portfolio.type).toBe(PortfolioType.WATCH_ONLY);
            expect(portfolio.meta.name).toBe('Watch Wallet');
            expect(portfolio.wallet.address).toBe(testAddress);
            expect(portfolio.wallet.xpub).toBeNull();
            expect(portfolio.wallet.address).toBe(testAddress);
        });

        it('should serialize and deserialize watch-only portfolio', () => {
            const portfolio = PortfolioFactory.generateWatchOnlyPortfolio(testAddress, {
                network: PortfolioNetworkType.MAINNET,
                meta: testMeta,
                vmType: VM_TYPE.BTC
            });

            const json = portfolio.toJSON();
            const parsed = sPortfolio.parse(json);
            const restored = PortfolioFactory.restorePortfolio(encryptor, parsed);

            expect(restored.type).toBe(PortfolioType.WATCH_ONLY);
            if (restored.type !== PortfolioType.WATCH_ONLY) throw new Error();
            expect(restored.wallet.address).toBe(testAddress);
            expect(restored.meta.name).toBe('Watch Wallet');
        });

        it('should produce deterministic ID for same address', () => {
            const p1 = PortfolioFactory.generateWatchOnlyPortfolio(testAddress, {
                network: PortfolioNetworkType.MAINNET,
                meta: testMeta,
                vmType: VM_TYPE.BTC
            });
            const p2 = PortfolioFactory.generateWatchOnlyPortfolio(testAddress, {
                network: PortfolioNetworkType.MAINNET,
                meta: testMeta,
                vmType: VM_TYPE.BTC
            });

            expect(p1.id.toString()).toBe(p2.id.toString());
        });

        it('should create watch-only portfolio from xpub', async () => {
            const mnemonic = generateMnemonic(wordlist, 128).split(' ');
            const accessor = new ClosableMnemonicAccessorVault(mnemonic);
            const bip39Portfolio = await portfolioFactory.generatePortfolioBip39(accessor, {
                network: PortfolioNetworkType.MAINNET,
                meta: { name: 'BIP39' }
            });
            const xpub = bip39Portfolio.derivations[0].chains.btc.xpub;

            expect(BtcXpub.validate(xpub)).toBe(true);

            const portfolio = PortfolioFactory.generateWatchOnlyPortfolio(xpub, {
                network: PortfolioNetworkType.MAINNET,
                meta: testMeta,
                vmType: VM_TYPE.BTC
            });

            expect(portfolio.type).toBe(PortfolioType.WATCH_ONLY);
            expect(portfolio.id.source).toBe(WatchOnlySource.XPUB);
            expect(portfolio.wallet.xpub).toBe(xpub);
            expect(portfolio.wallet.address.startsWith('bc1')).toBe(true);
        });

        it('should serialize and deserialize xpub-based watch-only', async () => {
            const mnemonic = generateMnemonic(wordlist, 128).split(' ');
            const accessor = new ClosableMnemonicAccessorVault(mnemonic);
            const bip39Portfolio = await portfolioFactory.generatePortfolioBip39(accessor, {
                network: PortfolioNetworkType.MAINNET,
                meta: { name: 'BIP39' }
            });
            const xpub = bip39Portfolio.derivations[0].chains.btc.xpub;

            const portfolio = PortfolioFactory.generateWatchOnlyPortfolio(xpub, {
                network: PortfolioNetworkType.MAINNET,
                meta: testMeta,
                vmType: VM_TYPE.BTC
            });

            const json = portfolio.toJSON();
            const parsed = sPortfolio.parse(json);
            const restored = PortfolioFactory.restorePortfolio(encryptor, parsed);

            expect(restored.type).toBe(PortfolioType.WATCH_ONLY);
            if (restored.type !== PortfolioType.WATCH_ONLY) throw new Error();
            expect(restored.wallet.address).toBe(portfolio.wallet.address);
            expect(restored.wallet.xpub).toBe(xpub);
        });

        it('should validate xpub input', () => {
            expect(BtcXpub.validate('xpub6CUG...')).toBe(false);
            expect(BtcXpub.validate(testAddress)).toBe(false);
            expect(BtcXpub.validate('')).toBe(false);
        });

        it('should have different source for address vs xpub', async () => {
            const addressPortfolio = PortfolioFactory.generateWatchOnlyPortfolio(testAddress, {
                network: PortfolioNetworkType.MAINNET,
                meta: testMeta,
                vmType: VM_TYPE.BTC
            });

            expect(addressPortfolio.id.source).toBe(WatchOnlySource.ADDRESS);

            const mnemonic = generateMnemonic(wordlist, 128).split(' ');
            const accessor = new ClosableMnemonicAccessorVault(mnemonic);
            const bip39 = await portfolioFactory.generatePortfolioBip39(accessor, {
                network: PortfolioNetworkType.MAINNET,
                meta: { name: 'BIP39' }
            });
            const xpub = bip39.derivations[0].chains.btc.xpub;

            const xpubPortfolio = PortfolioFactory.generateWatchOnlyPortfolio(xpub, {
                network: PortfolioNetworkType.MAINNET,
                meta: testMeta,
                vmType: VM_TYPE.BTC
            });

            expect(xpubPortfolio.id.source).toBe(WatchOnlySource.XPUB);
            expect(addressPortfolio.id.toString()).not.toBe(xpubPortfolio.id.toString());
        });
    });
});
