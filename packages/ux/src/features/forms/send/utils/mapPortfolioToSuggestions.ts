import { IDerivation, Portfolio, PortfolioType } from '@safely/core';

import { SendSuggestion } from '../types';

export function mapPortfolioToSuggestions(
    portfolio: Portfolio,
    activeDerivation?: IDerivation
): SendSuggestion[] {
    if (portfolio.type === PortfolioType.WATCH_ONLY) {
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
    return derivations
        .filter(d => !activeDerivation || !d.id.isEq(activeDerivation.id))
        .map(derivation => ({
            id: portfolio.id.toString(),
            address: derivation.chains.btc.wallets[0]?.address,
            meta: portfolio.meta,
            tag: derivations.length > 1 ? derivation.index + 1 : undefined
        }));
}
