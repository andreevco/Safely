import { Derivation, DerivationChainItemBtcSeed, IDerivation } from '../derivation';
import { IPortfolioDerivable, PortfolioType } from './I-portfolio';
import { PortfolioIdMnemonicBased } from './portfolio-id';
import { PortfolioMeta } from './portfolio-meta';
import { SPortfolioBip39In, SPortfolioBip39Out } from './portfolio.stored';
import { ISecretEncryptor } from '../../di';
import { Id } from '../../utils';
import { BtcWalletType } from '../blockchain';
import { SDerivation } from '../derivation/derivation.stored';
import { MnemonicResource, IMnemonicVaultEncryptedSecretStored, MnemonicVault } from '../mnemonic';
import { BtcBip39SeedProducer } from '../seed';
import { PortfolioSecretRevealedStatus } from './portfolio-secret-revealed-status';

export class PortfolioBip39 implements IPortfolioDerivable {
    public static restorePortfolio(
        secretEncryptor: ISecretEncryptor,
        sPortfolio: SPortfolioBip39Out
    ) {
        const mnemonicVault = new MnemonicVault(secretEncryptor, sPortfolio.encryptedSecret);
        return new PortfolioBip39({
            id: sPortfolio.id,
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

    public readonly id: PortfolioIdMnemonicBased<PortfolioType.BIP39>;

    public meta: PortfolioMeta;

    public secretRevealedStatus: PortfolioSecretRevealedStatus;

    public get type() {
        return this.id.type;
    }

    public get networkType() {
        return this.id.network;
    }

    public derivations: IDerivation[];

    private readonly mnemonicVault: IMnemonicVaultEncryptedSecretStored;

    constructor(params: {
        id: PortfolioIdMnemonicBased<PortfolioType.BIP39>;
        meta: PortfolioMeta;
        secretRevealedStatus: PortfolioSecretRevealedStatus;
        derivations: IDerivation[] | ((self: PortfolioBip39) => IDerivation[]);
        mnemonicVault: IMnemonicVaultEncryptedSecretStored;
    }) {
        if (!params.derivations.length) {
            throw new Error('Derivations cannot be empty.');
        }

        this.id = params.id;
        this.meta = params.meta;
        this.secretRevealedStatus = params.secretRevealedStatus;
        this.derivations = Array.isArray(params.derivations)
            ? params.derivations
            : params.derivations(this);
        this.mnemonicVault = params.mnemonicVault;
    }

    public removeDerivation(index: number): void {
        if (this.derivations.length === 1) {
            throw new Error('Cannot remove last derivation.');
        }

        this.derivations = this.derivations.filter(d => d.index !== index);
    }

    public async addNextDerivation() {
        const nextIndex = Math.max(...this.derivations.map(d => d.index));
        return this.addDerivation(nextIndex);
    }

    public async addDerivation(index: number) {
        const mnemonic = await this.mnemonicVault.getMnemonic();
        using mnemonicResource = new MnemonicResource(mnemonic);

        const seedProducer = new BtcBip39SeedProducer(mnemonicResource);

        const xpub = await DerivationChainItemBtcSeed.getXpub({
            seedProducer,
            network: this.networkType,
            derivationIndex: index,
            walletType: BtcWalletType.NATIVE_SEGWIT
        });
        const derivation = new Derivation(this, index, derivationRef => ({
            btc: DerivationChainItemBtcSeed.generate({
                xpub,
                seedProducer,
                derivationIndex: index,
                derivationRef
            })
        }));

        this.derivations = [...this.derivations, derivation].sort((a, b) => a.index - b.index);
    }

    public getDerivation(id: Id): IDerivation | undefined {
        return this.derivations.find(d => d.id.isEq(id));
    }

    public getDerivations(): IDerivation[] {
        return this.derivations;
    }

    public updateMeta(meta: Partial<PortfolioMeta>) {
        this.meta = { ...this.meta, ...meta };
    }

    public recordSecretReveal(fromDevice: string) {
        this.secretRevealedStatus = {
            revealedAt: new Date(),
            revealedFromDevice: fromDevice
        };
    }

    public getMnemonic(): Promise<string[]> {
        return this.mnemonicVault.getMnemonic();
    }

    public toJSON(): SPortfolioBip39In {
        return {
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
        };
    }
}
