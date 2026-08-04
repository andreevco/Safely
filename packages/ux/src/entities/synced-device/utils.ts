import type { Portfolio } from '@safely/core';
import type { SDeviceSyncState } from '@safely/sync-storage';

export function portfolioIds(portfolios: Portfolio[]): SDeviceSyncState['portfolioIds'] {
    return portfolios.map(p => p.id.toString());
}

export function areIdsEqual(a: readonly string[], b: readonly string[]): boolean {
    return a.length === b.length && a.every(id => b.includes(id));
}
