import type { AccountPortfolioSource } from '@safely/ux';

export function shouldCustomizePortfolio(source: AccountPortfolioSource | null): boolean {
    return source !== null && (source.kind === 'imported' || source.kind === 'watchOnly');
}
