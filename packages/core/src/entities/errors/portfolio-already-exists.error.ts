import type { IPortfolioBase } from '../portfolio/I-portfolio';

export class PortfolioAlreadyExistsError extends Error {
    constructor(public readonly existingPortfolio?: IPortfolioBase) {
        super();
    }
}
