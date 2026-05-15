import { type SDerivation, type SPortfolioBip39, sPortfolioBip39 } from '@safely/sync-storage';

import type { IDerivation } from '../derivation';
import { Derivation, DerivationChainItemBtcSeed } from '../derivation';
import type { IPortfolioDerivable, PortfolioSecretRevealedStatus } from './I-portfolio';
import { PortfolioType } from './I-portfolio';
import type { PortfolioIdBip39 } from './portfolio-id-bip39';
import { toPortfolioIdBip39 } from './portfolio-id-bip39';
import type { PortfolioMeta } from './portfolio-meta';
import type { ISecretEncryptor } from '../../di';
import type { Id } from '../../utils';
import { BtcWalletType } from '../blockchain';
import type { IMnemonicVaultEncryptedSecretStored } from '../mnemonic';
import { MnemonicResource, MnemonicVault } from '../mnemonic';
import { BtcBip39SeedProducer } from '../seed';

export class PortfolioBip39 implements IPortfolioDerivable {
    public static restore(secretEncryptor: ISecretEncryptor, sPortfolio: SPortfolioBip39) {
        const mnemonicVault = new MnemonicVault(secretEncryptor, sPortfolio.encryptedSecret);
        return new PortfolioBip39({
            id: toPortfolioIdBip39(sPortfolio.id),
            meta: sPortfolio.meta,
            secretRevealedStatus: sPortfolio.secretRevealedStatus
                ? {
                      revealedAt: new Date(sPortfolio.secretRevealedStatus.revealedAt),
                      revealedFromDevice: sPortfolio.secretRevealedStatus.revealedFromDevice
                  }
                : null,
            derivations: self =>
                sPortfolio.derivations.map(d => this.restoreDerivation(mnemonicVault, self, d)),
            mnemonicVault
        });
    }

    private static restoreDerivation(
        mnemonicVault: MnemonicVault,
        portfolioRef: PortfolioBip39,
        sDerivation: SDerivation
    ): IDerivation {
        return new Derivation(portfolioRef, sDerivation.index, derivationRef => ({
            btc: new DerivationChainItemBtcSeed({
                sDerivation: sDerivation.chains.btc,
                derivationIndex: sDerivation.index,
                seedProducer: new BtcBip39SeedProducer(mnemonicVault),
                derivationRef
            })
        }));
    }

    public readonly id: PortfolioIdBip39;

    public readonly meta: PortfolioMeta;

    public readonly secretRevealedStatus: PortfolioSecretRevealedStatus;

    public readonly type = PortfolioType.BIP39;

    public get networkType() {
        return this.id.network;
    }

    public readonly derivations: IDerivation[];

    private readonly mnemonicVault: IMnemonicVaultEncryptedSecretStored;

    constructor(params: {
        id: PortfolioIdBip39;
        meta: PortfolioMeta;
        secretRevealedStatus: PortfolioSecretRevealedStatus;
        derivations: IDerivation[] | ((self: PortfolioBip39) => IDerivation[]);
        mnemonicVault: IMnemonicVaultEncryptedSecretStored;
    }) {
        this.id = params.id;
        this.meta = params.meta;
        this.secretRevealedStatus = params.secretRevealedStatus;
        this.derivations = Array.isArray(params.derivations)
            ? params.derivations
            : params.derivations(this);
        this.mnemonicVault = params.mnemonicVault;

        if (!this.derivations.length) {
            throw new Error('Derivations cannot be empty.');
        }
    }

    public withoutDerivation(index: number): PortfolioBip39 {
        if (this.derivations.length === 1) {
            throw new Error('Cannot remove last derivation.');
        }

        return new PortfolioBip39({
            id: this.id,
            meta: this.meta,
            secretRevealedStatus: this.secretRevealedStatus,
            mnemonicVault: this.mnemonicVault,
            derivations: this.derivations.filter(d => d.index !== index)
        });
    }

    public async withAddedNextDerivation(): Promise<PortfolioBip39> {
        const nextIndex = Math.max(...this.derivations.map(d => d.index)) + 1;
        return this.withAddedDerivation(nextIndex);
    }

    public async withAddedDerivation(index: number): Promise<PortfolioBip39> {
        const mnemonic = await this.mnemonicVault.getMnemonic();
        using mnemonicResource = new MnemonicResource(mnemonic);

        const seedProducer = new BtcBip39SeedProducer(mnemonicResource);

        const xpub = await DerivationChainItemBtcSeed.getXpub({
            seedProducer,
            network: this.networkType,
            derivationIndex: index,
            walletType: BtcWalletType.NATIVE_SEGWIT
        });

        return new PortfolioBip39({
            id: this.id,
            meta: this.meta,
            secretRevealedStatus: this.secretRevealedStatus,
            mnemonicVault: this.mnemonicVault,
            derivations: self => {
                const newDerivation = new Derivation(self, index, derivationRef => ({
                    btc: DerivationChainItemBtcSeed.generate({
                        xpub,
                        seedProducer,
                        derivationIndex: index,
                        derivationRef
                    })
                }));
                return [...this.derivations, newDerivation].sort((a, b) => a.index - b.index);
            }
        });
    }

    public getDerivation(id: Id): IDerivation | undefined {
        return this.derivations.find(d => d.id.isEq(id));
    }

    public getDerivations(): IDerivation[] {
        return this.derivations;
    }

    public withMeta(meta: Partial<PortfolioMeta>): PortfolioBip39 {
        return new PortfolioBip39({
            id: this.id,
            meta: { ...this.meta, ...meta },
            secretRevealedStatus: this.secretRevealedStatus,
            mnemonicVault: this.mnemonicVault,
            derivations: this.derivations
        });
    }

    public withRecordedSecretReveal(fromDevice: string): PortfolioBip39 {
        return new PortfolioBip39({
            id: this.id,
            meta: this.meta,
            secretRevealedStatus: {
                revealedAt: new Date(),
                revealedFromDevice: fromDevice
            },
            mnemonicVault: this.mnemonicVault,
            derivations: this.derivations
        });
    }

    public getMnemonic(): Promise<string[]> {
        return this.mnemonicVault.getMnemonic();
    }

    public toJSON(): SPortfolioBip39 {
        return sPortfolioBip39.toJson({
            type: this.type,
            id: this.id.toJSON(),
            encryptedSecret: this.mnemonicVault.encryptedSecret,
            meta: this.meta,
            secretRevealedStatus: this.secretRevealedStatus
                ? {
                      revealedAt: this.secretRevealedStatus.revealedAt.getTime(),
                      revealedFromDevice: this.secretRevealedStatus.revealedFromDevice
                  }
                : null,
            derivations: this.derivations.map(d => d.toJSON())
        });
    }
}
