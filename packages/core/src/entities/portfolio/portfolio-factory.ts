import type { SPortfolio, SPortfolioWatchOnlyId } from '@safely/sync-storage';

import { PortfolioType, WatchOnlySource } from './I-portfolio';
import { PortfolioBip39 } from './portfolio-bip39';
import type { NoIconPortfolioMeta, PortfolioMeta } from './portfolio-meta';
import type { PortfolioNetworkType } from './portfolio-network-type';
import type { PortfolioWatchOnly } from './portfolio-watch-only';
import { PortfolioWatchOnlyBtc } from './portfolio-watch-only';
import { BtcXpub } from '../../blockchain-api/btc/btc-xpub';
import type { ISecretEncryptor } from '../../di';
import { assertUnreachable } from '../../utils';
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

    public static resolveBtcWatchOnlyInput(
        input: string,
        networkType: PortfolioNetworkType
    ): SPortfolioWatchOnlyId {
        const source = BtcXpub.validate(input) ? WatchOnlySource.XPUB : WatchOnlySource.ADDRESS;
        if (source === WatchOnlySource.XPUB) {
            return { source, xpub: input, networkType };
        } else {
            return { source, address: input, networkType };
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
                const id = PortfolioFactory.resolveBtcWatchOnlyInput(input, options.network);

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
