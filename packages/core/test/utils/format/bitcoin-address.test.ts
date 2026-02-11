import { beforeEach, describe, expect, it } from 'vitest';

import { MockSecretEncryptor, ClosableMnemonicAccessorVault } from './mocks';
import {
    PortfolioNetworkType,
    PortfolioFactory,
    PortfolioType,
    BtcWalletType,
    BtcNetwork,
    sPortfolio
} from '../../../src';
import type { SPortfolioBip39In } from '../../../src/entities/portfolio/portfolio.stored';

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
                name: portfolioName
            }
        );

        expect(portfolio).not.toBeNull();
        expect(portfolio!.meta.name).toEqual(portfolioName);
        expect(portfolio!.id.type).toBe(PortfolioType.BIP39);
        expect(portfolio!.id.network).toBe(PortfolioNetworkType.TESTNET);
        expect(portfolio!.type).toBe(PortfolioType.BIP39);
        expect(portfolio!.networkType).toBe(PortfolioNetworkType.TESTNET);
        expect(portfolio!.derivations[0].chains.btc.network).toBe(BtcNetwork.TESTNET);
        expect(portfolio!.derivations[0].chains.btc.wallets.length).toBe(1);
        expect(portfolio!.derivations[0].chains.btc.wallets[0].address).toBe(
            'tb1q4tvt7x6veyr96kj3deph5av03czytyw5ssalr6'
        );

        expect(encryptor.decryptSecret).toHaveBeenCalledTimes(0);
    });

    it('Should serialize and deserialize portfolio bip39', async () => {
        const testMnemonic =
            'firm idle yellow accuse lizard dial labor cushion blade voice spy impact'.split(' ');
        const portfolioName = 'Portfolio 1';

        const portfolio = await portfolioFactory.generatePortfolio(
            new ClosableMnemonicAccessorVault(testMnemonic),
            {
                network: PortfolioNetworkType.MAINNET,
                name: portfolioName
            }
        );

        expect(portfolio).not.toBeNull();

        const serialized = JSON.stringify(portfolio);
        const parsed: unknown = JSON.parse(serialized);

        const expectedStructure: SPortfolioBip39In = {
            id: {
                type: PortfolioType.BIP39,
                hash: portfolio!.id.toJSON().hash,
                networkType: PortfolioNetworkType.MAINNET
            },
            meta: {
                name: portfolioName,
                icon: portfolio!.meta.icon
            },
            derivations: [
                {
                    index: 0,
                    chains: {
                        btc: {
                            xpub: portfolio!.derivations[0].chains.btc.xpub,
                            wallets: [
                                {
                                    type: BtcWalletType.NATIVE_SEGWIT
                                }
                            ]
                        }
                    }
                }
            ],
            encryptedSecret: portfolio!.toJSON().encryptedSecret
        };

        expect(parsed).toMatchObject({
            id: { type: PortfolioType.BIP39, networkType: PortfolioNetworkType.MAINNET },
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
        );
        expect(portfolioRestored.type).toBe(PortfolioType.BIP39);
        expect(portfolioRestored.derivations[0].chains.btc.wallets[0].address).toBe(
            portfolio!.derivations[0].chains.btc.wallets[0].address
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
                name: portfolioName
            }
        );

        expect(portfolio).not.toBeNull();
        expect(portfolio!.meta.name).toEqual(portfolioName);
        expect(portfolio!.id.type).toBe(PortfolioType.BIP39);
        expect(portfolio!.id.network).toBe(PortfolioNetworkType.MAINNET);
        expect(portfolio!.type).toBe(PortfolioType.BIP39);
        expect(portfolio!.networkType).toBe(PortfolioNetworkType.MAINNET);

        expect(portfolio!.derivations[0].chains.btc.wallets[0].address.startsWith('bc1')).toBe(
            true
        );
        expect(portfolio!.derivations[0].chains.btc.wallets[0].address.length).toBeGreaterThan(10);

        expect(portfolio!.derivations[0].chains.btc.network).toBe(BtcNetwork.MAINNET);
        expect(portfolio!.derivations[0].chains.btc.wallets.length).toBe(1);
        expect(portfolio!.derivations[0].chains.btc.wallets[0].type).toBe(
            BtcWalletType.NATIVE_SEGWIT
        );

        const btcAddress = portfolio!.derivations[0].chains.btc.wallets[0].address;
        expect(btcAddress.startsWith('bc1')).toBe(true);
        expect(btcAddress.length).toBeGreaterThanOrEqual(42);
        expect(btcAddress.length).toBeLessThanOrEqual(62);

        expect(portfolio!.derivations[0].chains.btc.xpub).toBeDefined();
        expect(portfolio!.derivations[0].chains.btc.xpub).toMatch(/^xpub/);
        expect(portfolio!.derivations[0].chains.btc.xpub.length).toBeGreaterThan(100);

        expect(encryptor.decryptSecret).toHaveBeenCalledTimes(0);
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
                    name: portfolioName1
                }
            );

            const portfolio2 = await portfolioFactory.generatePortfolio(
                new ClosableMnemonicAccessorVault(mnemonic),
                {
                    network: PortfolioNetworkType.TESTNET,
                    name: portfolioName2
                }
            );

            expect(portfolio1).not.toBeNull();
            expect(portfolio2).not.toBeNull();

            expect(portfolio1!.id.toJSON().hash).toEqual(portfolio2!.id.toJSON().hash);
            expect(portfolio1!.id.type).toBe(PortfolioType.BIP39);
            expect(portfolio2!.id.type).toBe(PortfolioType.BIP39);
            expect(portfolio1!.id.network).toBe(PortfolioNetworkType.TESTNET);
            expect(portfolio2!.id.network).toBe(PortfolioNetworkType.TESTNET);
            expect(portfolio1!.derivations[0].chains.btc.network).toBe(BtcNetwork.TESTNET);
            expect(portfolio2!.derivations[0].chains.btc.network).toBe(BtcNetwork.TESTNET);
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
                    name: portfolioName
                }
            );

            const portfolioTestnet = await portfolioFactory.generatePortfolio(
                new ClosableMnemonicAccessorVault(mnemonic),
                {
                    network: PortfolioNetworkType.TESTNET,
                    name: portfolioName
                }
            );

            expect(portfolioMainnet).not.toBeNull();
            expect(portfolioTestnet).not.toBeNull();

            expect(portfolioMainnet!.id.network).toBe(PortfolioNetworkType.MAINNET);
            expect(portfolioTestnet!.id.network).toBe(PortfolioNetworkType.TESTNET);

            expect(portfolioMainnet!.derivations[0].chains.btc.network).toBe(BtcNetwork.MAINNET);
            expect(portfolioTestnet!.derivations[0].chains.btc.network).toBe(BtcNetwork.TESTNET);

            expect(portfolioMainnet!.id.type).toBe(PortfolioType.BIP39);
            expect(portfolioTestnet!.id.type).toBe(PortfolioType.BIP39);
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
                    name: portfolioName
                }
            );

            const portfolio2 = await portfolioFactory.generatePortfolio(
                new ClosableMnemonicAccessorVault(mnemonic),
                {
                    network: PortfolioNetworkType.MAINNET,
                    name: portfolioName
                }
            );

            expect(portfolio1).not.toBeNull();
            expect(portfolio2).not.toBeNull();

            expect(portfolio1!.derivations[0].chains.btc.wallets[0].address).toBe(
                portfolio2!.derivations[0].chains.btc.wallets[0].address
            );

            expect(portfolio1!.derivations[0].chains.btc.xpub).toBe(
                portfolio2!.derivations[0].chains.btc.xpub
            );

            expect(encryptor.decryptSecret).toHaveBeenCalledTimes(0);
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
                name: portfolioName
            }
        );

        expect(portfolio).not.toBeNull();

        expect(() => {
            portfolio!.removeDerivation(0);
        }).toThrow();

        expect(portfolio!.derivations.length).toBe(1);
        expect(portfolio!.derivations[0].chains.btc.network).toBe(BtcNetwork.TESTNET);
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
                name: portfolioName
            }
        );

        expect(portfolio).not.toBeNull();
        expect(portfolio!.meta.name).toEqual(portfolioName);
        expect(portfolio!.id.type).toBe(PortfolioType.BIP39);
        expect(portfolio!.id.network).toBe(PortfolioNetworkType.TESTNET);
        expect(portfolio!.type).toBe(PortfolioType.BIP39);
        expect(portfolio!.networkType).toBe(PortfolioNetworkType.TESTNET);
        expect(portfolio!.derivations[0].chains.btc.network).toBe(BtcNetwork.TESTNET);
        expect(portfolio!.derivations[0].chains.btc.wallets.length).toBe(1);

        const storedPortfolio: SPortfolioBip39In = {
            id: portfolio!.id.toJSON(),
            meta: portfolio!.meta,
            derivations: portfolio!.derivations.map(d => ({
                index: d.index,
                chains: {
                    btc: {
                        wallets: d.chains.btc.wallets.map(w => ({
                            type: w.type
                        })),
                        xpub: d.chains.btc.xpub
                    }
                }
            })),
            encryptedSecret: portfolio!.toJSON().encryptedSecret
        };

        const portfolioRestored = PortfolioFactory.restorePortfolio(
            encryptor,
            sPortfolio.parse(storedPortfolio)
        );

        expect(portfolioRestored.type).toBe(PortfolioType.BIP39);
        expect(portfolioRestored.id.type).toBe(PortfolioType.BIP39);
        expect(portfolioRestored.id.network).toBe(PortfolioNetworkType.TESTNET);
        expect(portfolioRestored.networkType).toBe(PortfolioNetworkType.TESTNET);
        expect(portfolioRestored.meta.name).toEqual(portfolioName);

        expect(portfolioRestored.derivations[0].chains.btc.network).toBe(BtcNetwork.TESTNET);
        expect(portfolioRestored.derivations[0].chains.btc.wallets[0].address).toBe(
            portfolio!.derivations[0].chains.btc.wallets[0].address
        );
        expect(portfolioRestored.derivations[0].chains.btc.xpub).toBe(
            portfolio!.derivations[0].chains.btc.xpub
        );
        expect(portfolioRestored.derivations[0].chains.btc.wallets[0].type).toBe(
            portfolio!.derivations[0].chains.btc.wallets[0].type
        );

        expect(encryptor.decryptSecret).toHaveBeenCalledTimes(0);
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
        const portfolio = await portfolioFactory.generatePortfolio(
            new ClosableMnemonicAccessorVault(invalidMnemonic),
            {
                network: PortfolioNetworkType.MAINNET,
                name: portfolioName
            }
        );

        expect(portfolio).toBeNull();
        expect(encryptor.decryptSecret).toHaveBeenCalledTimes(0);
    });

    it('rejects shortened mnemonic and produces no portfolio', async () => {
        const invalidMnemonic =
            'wonder enlist rival minute truck melody area person regret foam whip night'.split(' ');
        const portfolioName = 'Short mnemonic';
        const portfolio = await portfolioFactory.generatePortfolio(
            new ClosableMnemonicAccessorVault(invalidMnemonic),
            {
                network: PortfolioNetworkType.MAINNET,
                name: portfolioName
            }
        );

        expect(portfolio).toBeNull();
        expect(encryptor.decryptSecret).toHaveBeenCalledTimes(0);
    });

    it('rejects BIP39 mnemonic with wrong checksum', async () => {
        const invalidMnemonic =
            'ivory trouble wheat next depart dove choice easily enroll suffer lawsuit lens'.split(
                ' '
            );

        expect(invalidMnemonic.length).toBe(12);

        const portfolioName = 'Checksum mismatch';
        const portfolio = await portfolioFactory.generatePortfolio(
            new ClosableMnemonicAccessorVault(invalidMnemonic),
            {
                network: PortfolioNetworkType.MAINNET,
                name: portfolioName
            }
        );

        expect(portfolio).toBeNull();
        expect(encryptor.decryptSecret).toHaveBeenCalledTimes(0);
    });

    it('Should fail with empty mnemonic', async () => {
        const invalidMnemonic: string[] = [];
        const portfolioName = 'Empty Mnemonic';
        const portfolio = await portfolioFactory.generatePortfolio(
            new ClosableMnemonicAccessorVault(invalidMnemonic),
            {
                network: PortfolioNetworkType.MAINNET,
                name: portfolioName
            }
        );

        expect(portfolio).toBeNull();
        expect(encryptor.decryptSecret).toHaveBeenCalledTimes(0);
    });

    it('Should fail with too short mnemonic (5 words)', async () => {
        const invalidMnemonic = 'apple banana cherry date elder'.split(' ');
        const portfolioName = 'Short mnemonic';
        const portfolio = await portfolioFactory.generatePortfolio(
            new ClosableMnemonicAccessorVault(invalidMnemonic),
            {
                network: PortfolioNetworkType.MAINNET,
                name: portfolioName
            }
        );

        expect(portfolio).toBeNull();
        expect(encryptor.decryptSecret).toHaveBeenCalledTimes(0);
    });

    it('Should fail with too long mnemonic (30 words)', async () => {
        const invalidMnemonic = Array(30).fill('word') as string[];
        const portfolioName = 'Too long mnemonic';
        const portfolio = await portfolioFactory.generatePortfolio(
            new ClosableMnemonicAccessorVault(invalidMnemonic),
            {
                network: PortfolioNetworkType.MAINNET,
                name: portfolioName
            }
        );

        expect(portfolio).toBeNull();
        expect(encryptor.decryptSecret).toHaveBeenCalledTimes(0);
    });

    it('Should fail when mnemonic has duplicate words beyond allowed entropy', async () => {
        const invalidMnemonic =
            'apple apple apple apple apple apple apple apple apple apple apple apple'.split(' ');
        const portfolioName = 'Duplicates';
        const portfolio = await portfolioFactory.generatePortfolio(
            new ClosableMnemonicAccessorVault(invalidMnemonic),
            {
                network: PortfolioNetworkType.MAINNET,
                name: portfolioName
            }
        );

        expect(portfolio).toBeNull();
        expect(encryptor.decryptSecret).toHaveBeenCalledTimes(0);
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
                name: portfolioName
            }
        );

        expect(portfolio).not.toBeNull();
        const btcAddress = portfolio!.derivations[0].chains.btc.wallets[0].address;
        expect(btcAddress).toBeDefined();
        expect(btcAddress).not.toBeNull();
        expect(btcAddress.startsWith('bc1')).toBe(true);
    });
});
