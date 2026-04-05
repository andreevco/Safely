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
import { BtcWalletType, btcNetworkByPortfolioNetworkType } from '../blockchain';
import { DerivationChainItemBtcSeed, Derivation } from '../derivation';
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

    public static generateWatchOnlyPortfolio(
        input: string,
        options: {
            network: PortfolioNetworkType;
            meta: PortfolioMeta;
        }
    ): PortfolioWatchOnly {
        const isXpub = BtcXpub.validate(input);
        const source = isXpub ? WatchOnlySource.XPUB : WatchOnlySource.ADDRESS;
        const address = isXpub
            ? BtcXpub.deriveAddress(input, btcNetworkByPortfolioNetworkType(options.network))
            : input;
        const xpub = isXpub ? input : '';

        const portfolioId = new PortfolioIdWatchOnly(input, source, options.network);

        return new PortfolioWatchOnly({
            id: portfolioId,
            meta: options.meta,
            source,
            address,
            xpub,
            network: btcNetworkByPortfolioNetworkType(options.network)
        });
    }

    private async getMnemonicVault(mnemonicAccessor: IMnemonicAccessor): Promise<MnemonicVault> {
        return MnemonicVault.fromMnemonicAccessor(this.encryptor, mnemonicAccessor);
    }
}
