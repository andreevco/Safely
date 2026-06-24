import type { SPortfolioLedgerId } from './portfolio-ledger.schema';

export {
    portfolioWatchOnlyIdToString,
    portfolioBip39IdToString
} from '../../../v1/schemas/portfolio/portfolio-id-string';

export function portfolioLedgerIdToString(id: SPortfolioLedgerId): string {
    return ['portfolio', 'LEDGER', id.masterFingerprint, id.networkType].join(':');
}
