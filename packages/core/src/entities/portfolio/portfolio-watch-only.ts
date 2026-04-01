import { Derivation, IDerivation, DerivationChainItemBtcAddress } from '../derivation';
import { WatchOnlyOperationError } from '../errors';
import { IPortfolioDerivable } from './I-portfolio';
import { PortfolioIdAddressBased } from './portfolio-id-address-based';
import { PortfolioMeta } from './portfolio-meta';
import { PortfolioSecretRevealedStatus } from './portfolio-secret-revealed-status';
import { SPortfolioWatchOnlyIn, SPortfolioWatchOnlyOut } from './portfolio.stored';
import { Id } from '../../utils';

export class PortfolioWatchOnly implements IPortfolioDerivable {
    public static restorePortfolio(sPortfolio: SPortfolioWatchOnlyOut) {
        return new PortfolioWatchOnly({
            id: sPortfolio.id,
            meta: sPortfolio.meta,
            address: sPortfolio.address,
            derivations: self =>
                sPortfolio.derivations.map(
                    d =>
                        new Derivation(self, d.index, derivationRef => ({
                            btc: DerivationChainItemBtcAddress.generate({
                                address: sPortfolio.address,
                                derivationRef
                            })
                        }))
                )
        });
    }

    public readonly id: PortfolioIdAddressBased;

    public meta: PortfolioMeta;

    public readonly secretRevealedStatus: PortfolioSecretRevealedStatus = null;

    public readonly address: string;

    public derivations: IDerivation[];

    public get type() {
        return this.id.type;
    }

    public get networkType() {
        return this.id.network;
    }

    constructor(params: {
        id: PortfolioIdAddressBased;
        meta: PortfolioMeta;
        address: string;
        derivations: IDerivation[] | ((self: PortfolioWatchOnly) => IDerivation[]);
    }) {
        this.id = params.id;
        this.meta = params.meta;
        this.address = params.address;
        this.derivations = Array.isArray(params.derivations)
            ? params.derivations
            : params.derivations(this);
    }

    public async addDerivation(): Promise<void> {
        throw new WatchOnlyOperationError();
    }

    public async addNextDerivation(): Promise<void> {
        throw new WatchOnlyOperationError();
    }

    public removeDerivation(): void {
        throw new WatchOnlyOperationError();
    }

    public getDerivation(id: Id): IDerivation | undefined {
        return this.derivations.find(d => d.id.isEq(id));
    }

    public getDerivations(): IDerivation[] {
        return this.derivations;
    }

    public updateMeta(meta: Partial<PortfolioMeta>): void {
        this.meta = { ...this.meta, ...meta };
    }

    public recordSecretReveal(): void {
        throw new WatchOnlyOperationError();
    }

    public toJSON(): SPortfolioWatchOnlyIn {
        return {
            id: this.id.toJSON(),
            meta: this.meta,
            address: this.address,
            derivations: this.derivations.map(d => d.toJSON())
        };
    }
}
