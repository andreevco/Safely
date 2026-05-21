import type { SDerivation } from '@safely/sync-storage';

import type { IPortfolioDerivable } from '../portfolio';
import type { IDerivationChainItemBtc } from './btc/I-derivation-chain-item-btc';
import type { Id } from '../../utils/id';

export interface IDerivationId extends Id {
    derivationIndex: number;
    portfolioId: Id;
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
