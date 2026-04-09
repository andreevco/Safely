import { PortfolioType, WatchOnlySource } from './I-portfolio';
import { PortfolioBip39 } from './portfolio-bip39';
import { PortfolioIdMnemonicBased } from './portfolio-id';
import { PortfolioIdWatchOnly } from './portfolio-id-watch-only';
import { NoIconPortfolioMeta, PortfolioMeta } from './portfolio-meta';
import { PortfolioNetworkType } from './portfolio-network-type';
import { PortfolioWatchOnly } from './portfolio-watch-only';
import type { SPortfolioOut } from './portfolio.stored';
import { BtcXpub } from '../../blockchain-api/btc/btc-xpub';
import { ISecretEncryptor } from '../../di';
import { assertUnreachable } from '../../utils';
import { BtcNetwork, BtcWalletType, btcNetworkByPortfolioNetworkType, VMType } from '../blockchain';
import { DerivationChainItemBtcSeed, Derivation } from '../derivation';
import { BtcWalletId } from '../derivation/btc/btc-wallet-id';
import { BtcWalletReadOnly } from '../derivation/btc/I-btc-wallet';
import { InvalidMnemonicError, PortfolioGenerationFailedError } from '../errors';
import {
    MNEMONIC_TYPE,
    MnemonicResource,
    validateMnemonic,
    IMnemonicAccessor,
    MnemonicVault
} from '../mnemonic';
import { BtcBip39SeedProducer } from '../seed';

export class PortfolioFactory {
    public static restorePortfolio(encryptor: ISecretEncryptor, portfolio: SPortfolioOut) {
        switch (portfolio.type) {
            case PortfolioType.BIP39:
                return PortfolioBip39.restorePortfolio(encryptor, portfolio);
            case PortfolioType.WATCH_ONLY:
                return PortfolioWatchOnly.restorePortfolio(portfolio);
            default:
                assertUnreachable(portfolio);
        }
    }
    constructor(private readonly encryptor: ISecretEncryptor) {}

    public async generatePortfolio(
        secret: IMnemonicAccessor,
        options: {
            network: PortfolioNetworkType;
            meta: NoIconPortfolioMeta;
            seedRevealedFromDevice?: string;
        }
    ): Promise<PortfolioBip39> {
        return await this.generatePortfolioBip39(secret, options);
    }

    public async generatePortfolioBip39(
        mnemonicAccessor: IMnemonicAccessor,
        options: {
            network: PortfolioNetworkType;
            meta: NoIconPortfolioMeta;
            seedRevealedFromDevice?: string;
        }
    ): Promise<PortfolioBip39> {
        try {
            await validateMnemonic(MNEMONIC_TYPE.BIP39, mnemonicAccessor.value);

            const portfolioId = await PortfolioIdMnemonicBased.create(
                mnemonicAccessor,
                options.network
            );

            const derivationIndex = 0;

            using mnemonicResource = new MnemonicResource(mnemonicAccessor);

            const xpub = await DerivationChainItemBtcSeed.getXpub({
                seedProducer: new BtcBip39SeedProducer(mnemonicResource),
                walletType: BtcWalletType.NATIVE_SEGWIT,
                network: options.network,
                derivationIndex
            });

            const mnemonicVault = await this.getMnemonicVault(mnemonicAccessor);
            const meta = {
                name: options.meta.name,
                icon: options.meta.icon ?? portfolioId.getFallbackEmoji()
            };

            return new PortfolioBip39({
                id: portfolioId,
                meta,
                secretRevealedStatus: options.seedRevealedFromDevice
                    ? {
                          revealedAt: new Date(),
                          revealedFromDevice: options.seedRevealedFromDevice
                      }
                    : null,
                derivations: self => [
                    new Derivation(self, derivationIndex, derivationRef => ({
                        btc: DerivationChainItemBtcSeed.generate({
                            xpub,
                            seedProducer: new BtcBip39SeedProducer(mnemonicVault),
                            derivationIndex,
                            derivationRef
                        })
                    }))
                ],
                mnemonicVault
            });
        } catch (error) {
            if (error instanceof InvalidMnemonicError) {
                throw error;
            }

            console.error(error);
            throw new PortfolioGenerationFailedError(undefined, { cause: error });
        }
    }

    public static resolveWatchOnlyId(
        input: string,
        network: PortfolioNetworkType,
        vmType: VMType
    ): PortfolioIdWatchOnly {
        let source: WatchOnlySource;

        switch (vmType) {
            case VMType.BTC:
                source = BtcXpub.validate(input) ? WatchOnlySource.XPUB : WatchOnlySource.ADDRESS;
                break;
            default:
                assertUnreachable(vmType);
        }

        return new PortfolioIdWatchOnly(input, source, network, vmType);
    }

    public static generateWatchOnlyPortfolio(
        input: string,
        options: {
            network: PortfolioNetworkType;
            meta: PortfolioMeta;
            vmType: VMType;
        }
    ): PortfolioWatchOnly {
        const portfolioId = PortfolioFactory.resolveWatchOnlyId(
            input,
            options.network,
            options.vmType
        );

        switch (options.vmType) {
            case VMType.BTC: {
                const btcNetwork = btcNetworkByPortfolioNetworkType(options.network);
                const { address, xpub } = PortfolioFactory.resolveBtcWatchOnlyInput(
                    input,
                    portfolioId.source,
                    btcNetwork
                );

                const wallet: BtcWalletReadOnly = {
                    vmType: VMType.BTC,
                    id: new BtcWalletId(portfolioId, address),
                    type: BtcWalletType.NATIVE_SEGWIT,
                    address,
                    network: btcNetwork,
                    xpub
                };

                return new PortfolioWatchOnly({
                    id: portfolioId,
                    meta: options.meta,
                    vmType: VMType.BTC,
                    source: portfolioId.source,
                    wallet
                });
            }
            default:
                assertUnreachable(options.vmType);
        }
    }

    private static resolveBtcWatchOnlyInput(
        input: string,
        source: WatchOnlySource,
        btcNetwork: BtcNetwork
    ): { address: string; xpub: string | null } {
        switch (source) {
            case WatchOnlySource.XPUB:
                return { address: BtcXpub.deriveAddress(input, btcNetwork), xpub: input };
            case WatchOnlySource.ADDRESS:
                return { address: input, xpub: null };
            default:
                assertUnreachable(source);
        }
    }

    private async getMnemonicVault(mnemonicAccessor: IMnemonicAccessor): Promise<MnemonicVault> {
        return MnemonicVault.fromMnemonicAccessor(this.encryptor, mnemonicAccessor);
    }
}
