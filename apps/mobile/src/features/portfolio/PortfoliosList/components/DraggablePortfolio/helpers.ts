import type { IDerivation, Portfolio } from '@safely/core';
import { PortfolioType } from '@safely/core';

export const getDerivations = (portfolio: Portfolio): IDerivation[] =>
    portfolio.type === PortfolioType.WATCH_ONLY ? [] : portfolio.getDerivations();
