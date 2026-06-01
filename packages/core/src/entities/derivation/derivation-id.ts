import type { IDerivationId } from './I-derivation';
import { Id } from '../../utils/id';

export class DerivationId extends Id implements IDerivationId {
    constructor(
        public readonly portfolioId: Id,
        public readonly derivationIndex: number
    ) {
        super();
    }

    public toString(): string {
        return this.of(this.portfolioId, 'derivation', this.derivationIndex);
    }
}
