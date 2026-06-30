import type { ILedgerDerivation, Portfolio } from '@safely/core';
import { PortfolioType } from '@safely/core';

export const getDerivations = (portfolio: Portfolio): ILedgerDerivation[] =>
    portfolio.type === PortfolioType.LEDGER ? portfolio.getDerivations() : [];
