import type { IPortfolioDerivable } from '../portfolio';
import type { IDerivationChainItemBtc } from './btc/I-derivation-chain-item-btc';
import type { SDerivation } from './derivation.stored';
import { Id } from '../../utils/id';
import { IPortfolioId } from '../portfolio/portfolio-id';

export interface IDerivationId extends Id {
    derivationIndex: number;
    portfolioId: IPortfolioId;
}

export interface IDerivation {
    index: number;
    id: IDerivationId;
    chains: IDerivationChains;
    portfolioRef: IPortfolioDerivable;

    toJSON(): SDerivation;
}

export interface IDerivationChains {
    btc: IDerivationChainItemBtc;
}
