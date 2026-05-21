import { usePortfolios } from '@safely/ux';

import { AccountSelector } from './components/AccountSelector';
import { CompactAccountSelector } from './components/CompactAccountSelector';

export const WalletSelector = () => {
    const portfolios = usePortfolios();
    const portfolioCount = portfolios.length;

    if (portfolioCount === 0) {
        return null;
    }

    return portfolioCount <= 10 ? <CompactAccountSelector /> : <AccountSelector />;
};
