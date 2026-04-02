import { IPortfolioDerivable } from '../portfolio/I-portfolio';

export class PortfolioAlreadyExistsError extends Error {
    constructor(public readonly existingPortfolio?: IPortfolioDerivable) {
        super();
    }
}
