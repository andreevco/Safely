import { type SDerivation, sDerivation } from '@safely/sync-storage';

import type { IPortfolioDerivable } from '../portfolio';
import { DerivationId } from './derivation-id';
import type { IDerivation, IDerivationChains } from './I-derivation';

export class Derivation implements IDerivation {
    public readonly id: DerivationId;

    public readonly chains: IDerivationChains;

    public get index(): number {
        return this.id.derivationIndex;
    }

    constructor(
        public portfolioRef: IPortfolioDerivable,
        index: number,
        chains: IDerivationChains | ((self: Derivation) => IDerivationChains)
    ) {
        this.id = new DerivationId(this.portfolioRef.id, index);
        this.chains = typeof chains === 'function' ? chains(this) : chains;
    }

    public toJSON(): SDerivation {
        return sDerivation.toJson({
            index: this.index,
            chains: derivationChainsToJSON(this.chains)
        });
    }
}
function derivationChainsToJSON(chains: IDerivationChains): SDerivation['chains'] {
    return {
        btc: chains.btc.toJSON()
    };
}
