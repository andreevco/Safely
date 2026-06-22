import { type SDerivation, sDerivation } from '@safely/sync-storage';

import type { IPortfolioBase } from '../portfolio';
import { DerivationId } from './derivation-id';
import type { DerivationMeta, IDerivation, IDerivationChains } from './I-derivation';

export class Derivation implements IDerivation {
    public readonly id: DerivationId;

    public readonly chains: IDerivationChains;

    public readonly meta?: DerivationMeta;

    public get index(): number {
        return this.id.derivationIndex;
    }

    constructor(
        public portfolioRef: IPortfolioBase,
        index: number,
        chains: IDerivationChains | ((self: Derivation) => IDerivationChains),
        meta?: DerivationMeta
    ) {
        this.id = new DerivationId(this.portfolioRef.id, index);
        this.chains = typeof chains === 'function' ? chains(this) : chains;
        this.meta = meta;
    }

    public toJSON(): SDerivation {
        return sDerivation.toJson({
            index: this.index,
            meta: this.meta,
            chains: derivationChainsToJSON(this.chains)
        });
    }
}
function derivationChainsToJSON(chains: IDerivationChains): SDerivation['chains'] {
    return {
        btc: chains.btc.toJSON()
    };
}
