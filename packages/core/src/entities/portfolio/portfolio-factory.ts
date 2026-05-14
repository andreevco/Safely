import type { SPortfolio } from '@safely/sync-storage';

import { PortfolioType, WatchOnlySource } from './I-portfolio';
import { PortfolioBip39 } from './portfolio-bip39';
import type { NoIconPortfolioMeta, PortfolioMeta } from './portfolio-meta';
import type { PortfolioNetworkType } from './portfolio-network-type';
import type { PortfolioWatchOnly } from './portfolio-watch-only';
import { PortfolioWatchOnlyBtc } from './portfolio-watch-only';
import { BtcXpub } from '../../blockchain-api/btc/btc-xpub';
import type { ISecretEncryptor } from '../../di';
import { assertUnreachable } from '../../utils';
import type { BtcNetwork } from '../blockchain';
import { BtcWalletType, VM_TYPE } from '../blockchain';
import { DerivationChainItemBtcSeed, Derivation } from '../derivation';
import { InvalidMnemonicError, PortfolioGenerationFailedError } from '../errors';
import type { IMnemonicAccessor } from '../mnemonic';
import { MNEMONIC_TYPE, MnemonicResource, validateMnemonic, MnemonicVault } from '../mnemonic';
import { BtcBip39SeedProducer } from '../seed';
import { PortfolioIdBip39Imported } from './portfolio-id-bip39';

export class PortfolioFactory {
    public static restorePortfolio(encryptor: ISecretEncryptor, portfolio: SPortfolio) {
        switch (portfolio.type) {
            case PortfolioType.BIP39:
                return PortfolioBip39.restore(encryptor, portfolio);
            case PortfolioType.WATCH_ONLY:
                return PortfolioWatchOnlyBtc.restore(portfolio);
            default:
                assertUnreachable(portfolio);
        }
    }

    private static resolveBtcWatchOnlyInput(
        input: string,
        source: WatchOnlySource,
        btcNetwork: BtcNetwork
    ): { address: string; xpub: string | null } {
        switch (source) {
            case WatchOnlySource.XPUB:
                return {
                    address: BtcXpub.deriveAddress(input, btcNetwork, BtcWalletType.NATIVE_SEGWIT),
                    xpub: input
                };
            case WatchOnlySource.ADDRESS:
                return { address: input, xpub: null };
            default:
                assertUnreachable(source);
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

            const portfolioId = await PortfolioIdBip39Imported.create(
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

            throw new PortfolioGenerationFailedError(undefined, { cause: error });
        }
    }

    public static generateWatchOnlyPortfolio(
        input: string,
        options: {
            network: PortfolioNetworkType;
            meta: PortfolioMeta;
            vmType: VM_TYPE;
        }
    ): PortfolioWatchOnly {
        switch (options.vmType) {
            case VM_TYPE.BTC: {
                const source = BtcXpub.validate(input)
                    ? WatchOnlySource.XPUB
                    : WatchOnlySource.ADDRESS;
                let id;
                if (source === WatchOnlySource.XPUB) {
                    id = { source, xpub: input, networkType: options.network };
                } else {
                    id = { source, address: input, networkType: options.network };
                }

                return PortfolioWatchOnlyBtc.create(id, options.meta);
            }
            default:
                assertUnreachable(options.vmType);
        }
    }

    private async getMnemonicVault(mnemonicAccessor: IMnemonicAccessor): Promise<MnemonicVault> {
        return MnemonicVault.fromMnemonicAccessor(this.encryptor, mnemonicAccessor);
    }
}
