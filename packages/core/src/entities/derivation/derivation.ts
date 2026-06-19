import { type SDerivation, sDerivation } from '@safely/sync-storage';

import type { IPortfolioBase } from '../portfolio';
import { DerivationId } from './derivation-id';
import type { IDerivation, IDerivationChains } from './I-derivation';

export class Derivation implements IDerivation {
    public readonly id: DerivationId;

    public readonly chains: IDerivationChains;

    public readonly name?: string;

    public get index(): number {
        return this.id.derivationIndex;
    }

    constructor(
        public portfolioRef: IPortfolioBase,
        index: number,
        chains: IDerivationChains | ((self: Derivation) => IDerivationChains),
        name?: string
    ) {
        this.id = new DerivationId(this.portfolioRef.id, index);
        this.chains = typeof chains === 'function' ? chains(this) : chains;
        this.name = name;
    }

    public toJSON(): SDerivation {
        return sDerivation.toJson({
            index: this.index,
            name: this.name,
            chains: derivationChainsToJSON(this.chains)
        });
    }
}
function derivationChainsToJSON(chains: IDerivationChains): SDerivation['chains'] {
    return {
        btc: chains.btc.toJSON()
    };
}
