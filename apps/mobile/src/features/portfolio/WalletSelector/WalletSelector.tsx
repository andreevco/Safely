import type { Portfolio } from '@safely/core';
import { PortfolioType } from '@safely/core';
import { usePortfolios } from '@safely/ux';

import { AccountSelector } from './components/AccountSelector';
import { CompactAccountSelector } from './components/CompactAccountSelector';

const MAX_COMPACT_ROWS = 10;

const rowCount = (portfolio: Portfolio): number => {
    if (portfolio.type === PortfolioType.WATCH_ONLY) {
        return 1;
    }

    const derivations = portfolio.getDerivations().length;

    return derivations > 1 ? derivations + 1 : 1;
};

export const WalletSelector = () => {
    const portfolios = usePortfolios();

    if (portfolios.length === 0) {
        return null;
    }

    const totalRows = portfolios.reduce((sum, portfolio) => sum + rowCount(portfolio), 0);

    return totalRows <= MAX_COMPACT_ROWS ? <CompactAccountSelector /> : <AccountSelector />;
};
