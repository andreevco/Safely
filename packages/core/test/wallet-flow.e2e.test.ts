import { generateMnemonic } from '@scure/bip39';
import { wordlist } from '@scure/bip39/wordlists/english.js';
import { beforeEach, describe, expect, it } from 'vitest';

import {
    PortfolioFactory,
    PortfolioNetworkType,
    PortfolioType,
    BtcWalletType,
    BtcNetwork,
    sPortfolio
} from '../src';
import { MockSecretEncryptor, ClosableMnemonicAccessorVault } from './utils/format/mocks';
import { BtcAddress } from '../src/blockchain-api/btc/btc-address';

/**
 * End-to-end tests for wallet flows:
 * - successful creation of a new wallet
 * - adding an existing wallet by mnemonic (import)
 * - watch-only address validation (for future watch-only portfolio flow)
 */

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

const WATCH_ONLY_TEST_ADDRESS = 'bc1qcleg3jtmvlar6cgm24vpq6n8ew3d0hame0av83';

describe('Wallet flow E2E', () => {
    let encryptor: MockSecretEncryptor;
    let portfolioFactory: PortfolioFactory;

    beforeEach(() => {
        encryptor = new MockSecretEncryptor();
        portfolioFactory = new PortfolioFactory(encryptor);
    });

    describe('Create new wallet', () => {
        it('should successfully create a new wallet and derive valid BTC mainnet address', async () => {
            const mnemonic = generateMnemonic(wordlist, 128).split(' ');
            const accessor = new ClosableMnemonicAccessorVault(mnemonic);
            const name = 'New Wallet';

            const portfolio = await portfolioFactory.generatePortfolioBip39(accessor, {
                network: PortfolioNetworkType.MAINNET,
                name
            });

            // Портфолио успешно создано
            expect(portfolio).not.toBeNull();
            // Проверка метаданных: имя кошелька
            expect(portfolio!.meta.name).toBe(name);
            // Тип портфолио — BIP39, сеть — mainnet
            expect(portfolio!.id.type).toBe(PortfolioType.BIP39);
            expect(portfolio!.id.network).toBe(PortfolioNetworkType.MAINNET);
            expect(portfolio!.type).toBe(PortfolioType.BIP39);
            expect(portfolio!.networkType).toBe(PortfolioNetworkType.MAINNET);
            // Один derivation, один BTC-кошелёк в нём
            expect(portfolio!.derivations).toHaveLength(1);
            expect(portfolio!.derivations[0].chains.btc.wallets).toHaveLength(1);

            const btcWallet = portfolio!.derivations[0].chains.btc.wallets[0];
            // Адрес сгенерирован и в формате SegWit (bc1…)
            expect(btcWallet.address).toBeDefined();
            expect(btcWallet.address.startsWith('bc1')).toBe(true);
            // Тип кошелька — Native SegWit
            expect(btcWallet.type).toBe(BtcWalletType.NATIVE_SEGWIT);
            expect(portfolio!.derivations[0].chains.btc.network).toBe(BtcNetwork.MAINNET);

            // Сериализация в JSON сохраняет тип и имя
            const serialized = portfolio!.toJSON();
            expect(serialized.id.type).toBe(PortfolioType.BIP39);
            expect(serialized.meta.name).toBe(name);
        });
    });

    describe('Add existing wallet (import by mnemonic)', () => {
        it('should successfully import existing wallet from mnemonic and match expected address', async () => {
            const name = 'Imported Wallet';
            const accessor = new ClosableMnemonicAccessorVault(IMPORT_EXISTING_MNEMONIC);

            const portfolio = await portfolioFactory.generatePortfolio(accessor, {
                network: PortfolioNetworkType.MAINNET,
                name
            });

            // Импорт прошёл успешно
            expect(portfolio).not.toBeNull();
            // Имя задано корректно
            expect(portfolio!.meta.name).toBe(name);
            // Тип BIP39, сеть mainnet
            expect(portfolio!.id.type).toBe(PortfolioType.BIP39);
            expect(portfolio!.id.network).toBe(PortfolioNetworkType.MAINNET);
            expect(portfolio!.derivations[0].chains.btc.network).toBe(BtcNetwork.MAINNET);
            // Кошелёк — Native SegWit
            expect(portfolio!.derivations[0].chains.btc.wallets[0].type).toBe(
                BtcWalletType.NATIVE_SEGWIT
            );

            const address = portfolio!.derivations[0].chains.btc.wallets[0].address;
            // Адрес есть, формат bc1…, длина в допустимых границах для bech32
            expect(address).toBeDefined();
            expect(address.startsWith('bc1')).toBe(true);
            expect(address.length).toBeGreaterThanOrEqual(42);
            expect(address.length).toBeLessThanOrEqual(62);

            // Расширенный публичный ключ (xpub) присутствует и в ожидаемом формате
            expect(portfolio!.derivations[0].chains.btc.xpub).toBeDefined();
            expect(portfolio!.derivations[0].chains.btc.xpub).toMatch(/^xpub/);

            // Восстановление из сохранённого состояния: адрес совпадает с исходным
            const restored = PortfolioFactory.restorePortfolio(
                encryptor,
                sPortfolio.parse(portfolio!.toJSON())
            );
            expect(restored.derivations[0].chains.btc.wallets[0].address).toBe(address);
        });
    });

    describe('Watch-only address', () => {
        it('should accept valid watch-only Bitcoin address (SegWit) for future watch-only flow', () => {
            const address = WATCH_ONLY_TEST_ADDRESS;

            // Тип адреса — P2WPKH (Pay to Witness Public Key Hash)
            const type = BtcAddress.type(address);
            expect(type).toBe('P2WPKH');
            // Адрес распознаётся как SegWit
            expect(BtcAddress.isSegWit(address)).toBe(true);
            // Префикс bc1q — mainnet SegWit (P2WPKH)
            expect(address.startsWith('bc1q')).toBe(true);
            // Длина в допустимом диапазоне для bech32-адреса
            expect(address.length).toBeGreaterThanOrEqual(42);
            expect(address.length).toBeLessThanOrEqual(62);
        });
    });
});
