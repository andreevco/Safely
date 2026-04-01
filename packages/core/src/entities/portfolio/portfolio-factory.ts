import { PortfolioType } from './I-portfolio';
import { PortfolioBip39 } from './portfolio-bip39';
import { PortfolioIdMnemonicBased } from './portfolio-id';
import { PortfolioIdAddressBased } from './portfolio-id-address-based';
import { PortfolioMeta } from './portfolio-meta';
import { PortfolioNetworkType } from './portfolio-network-type';
import { PortfolioWatchOnly } from './portfolio-watch-only';
import type { SPortfolioBip39Out, SPortfolioOut, SPortfolioWatchOnlyOut } from './portfolio.stored';
import { ISecretEncryptor } from '../../di';
import { assertUnreachable } from '../../utils';
import { BtcWalletType } from '../blockchain';
import {
    DerivationChainItemBtcSeed,
    Derivation,
    DerivationChainItemBtcAddress
} from '../derivation';
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
        const type = portfolio.id.type;

        switch (type) {
            case PortfolioType.BIP39:
                return PortfolioBip39.restorePortfolio(encryptor, portfolio as SPortfolioBip39Out);
            case PortfolioType.WATCH_ONLY:
                return PortfolioWatchOnly.restorePortfolio(portfolio as SPortfolioWatchOnlyOut);
            default:
                assertUnreachable(type);
        }
    }
    constructor(private readonly encryptor: ISecretEncryptor) {}

    public async generatePortfolio(
        secret: IMnemonicAccessor,
        options: {
            network: PortfolioNetworkType;
            name: string;
            seedRevealedFromDevice?: string;
        }
    ): Promise<PortfolioBip39> {
        return await this.generatePortfolioBip39(secret, options);
    }

    public async generatePortfolioBip39(
        mnemonicAccessor: IMnemonicAccessor,
        options: {
            network: PortfolioNetworkType;
            name: string;
            seedRevealedFromDevice?: string;
        }
    ): Promise<PortfolioBip39> {
        try {
            await validateMnemonic(MNEMONIC_TYPE.BIP39, mnemonicAccessor.value);

            const portfolioId = await PortfolioIdMnemonicBased.create(
                PortfolioType.BIP39,
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
            const emoji = portfolioId.getFallbackEmoji();

            return new PortfolioBip39({
                id: portfolioId,
                meta: {
                    name: options.name,
                    icon: emoji
                },
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
        address: string,
        options: {
            network: PortfolioNetworkType;
            meta: PortfolioMeta;
        }
    ): PortfolioWatchOnly {
        const portfolioId = PortfolioIdAddressBased.create(address, options.network);

        return new PortfolioWatchOnly({
            id: portfolioId,
            meta: options.meta,
            address,
            derivations: self => [
                new Derivation(self, 0, derivationRef => ({
                    btc: DerivationChainItemBtcAddress.generate({
                        address,
                        derivationRef
                    })
                }))
            ]
        });
    }

    private async getMnemonicVault(mnemonicAccessor: IMnemonicAccessor): Promise<MnemonicVault> {
        return MnemonicVault.fromMnemonicAccessor(this.encryptor, mnemonicAccessor);
    }
}
