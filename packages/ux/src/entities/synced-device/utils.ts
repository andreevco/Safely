import type { Portfolio } from '@safely/core';
import { Bip39Source, PortfolioType } from '@safely/core';
import type { SDeviceSyncState } from '@safely/sync-storage';

export function isSensitivePortfolio(portfolio: Portfolio): boolean {
    return portfolio.type === PortfolioType.BIP39 && portfolio.id.source === Bip39Source.IMPORTED;
}

export function portfolioIds(portfolios: Portfolio[]): SDeviceSyncState['portfolioIds'] {
    return Object.fromEntries(
        portfolios.filter(isSensitivePortfolio).map(p => [p.id.toString(), true])
    );
}

export function areIdsEqual(
    a: SDeviceSyncState['portfolioIds'],
    b: SDeviceSyncState['portfolioIds']
): boolean {
    const aKeys = Object.keys(a);

    return aKeys.length === Object.keys(b).length && aKeys.every(id => b[id]);
}
