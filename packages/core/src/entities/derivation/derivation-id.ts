import type { IDerivationId } from './I-derivation';
import { Id } from '../../utils/id';
import { IPortfolioId } from '../portfolio/portfolio-id';

export class DerivationId extends Id implements IDerivationId {
    constructor(
        public readonly portfolioId: IPortfolioId,
        public readonly derivationIndex: number
    ) {
        super();
    }

    public toString(): string {
        return this.of(this.portfolioId, 'derivation', this.derivationIndex);
    }
}
