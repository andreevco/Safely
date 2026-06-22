import type { IDerivation, IPortfolioId, Portfolio } from '@safely/core';
import { PortfolioType } from '@safely/core';

import type { PortfolioSuggestion } from '../types';

export interface ActivePortfolioEntity {
    portfolioId: IPortfolioId;
    derivation?: IDerivation;
}

export function mapPortfolioToSuggestions(
    portfolio: Portfolio,
    active: ActivePortfolioEntity | undefined,
    derivationName: (index: number) => string
): PortfolioSuggestion[] {
    const isActivePortfolio = !!active && portfolio.id.isEq(active.portfolioId);

    if (portfolio.type === PortfolioType.WATCH_ONLY) {
        if (isActivePortfolio) return [];

        return [
            {
                id: portfolio.id.toString(),
                address: portfolio.wallet.address,
                meta: portfolio.meta,
                isWatchOnly: true
            }
        ];
    }

    const derivations = portfolio.getDerivations();
    const isMultiDerivation = derivations.length > 1;

    return derivations
        .filter(d => !(isActivePortfolio && active?.derivation && d.id.isEq(active.derivation.id)))
        .map(derivation => ({
            id: derivation.id.toString(),
            address: derivation.chains.btc.wallets[0]?.address,
            meta: isMultiDerivation
                ? {
                      name: derivation.meta?.name ?? derivationName(derivation.index + 1),
                      icon: portfolio.meta.icon
                  }
                : portfolio.meta,
            tag: isMultiDerivation ? derivation.index + 1 : undefined
        }));
}
