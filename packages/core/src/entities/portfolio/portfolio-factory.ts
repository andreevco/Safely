import type { SPortfolio } from '@safely/sync-storage';

import { PortfolioType } from './I-portfolio';
import { PortfolioBip39 } from './portfolio-bip39';
import { PortfolioWatchOnlyBtc } from './portfolio-watch-only';
import type { ISecretEncryptor } from '../../di';
import { assertUnreachable } from '../../utils';

export class PortfolioFactory {
    public static restorePortfolio(encryptor: ISecretEncryptor, portfolio: SPortfolio) {
        switch (portfolio.type) {
            case PortfolioType.BIP39:
                return PortfolioBip39.restore(encryptor, portfolio);
            case PortfolioType.WATCH_ONLY:
                return PortfolioWatchOnlyBtc.restore(portfolio);
            default:
                assertUnreachable(portfolio);
        }
    }
}
