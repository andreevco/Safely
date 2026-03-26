import { usePortfoliosQuery } from '@safely/ux';

import { AccountSelector } from './components/AccountSelector';
import { CompactAccountSelector } from './components/CompactAccountSelector';

export const WalletSelector = () => {
    const portfolios = usePortfoliosQuery().data;
    const portfolioCount = portfolios?.length ?? 0;

    if (portfolioCount === 0) {
        return null;
    }

    return portfolioCount <= 10 ? <CompactAccountSelector /> : <AccountSelector />;
};
