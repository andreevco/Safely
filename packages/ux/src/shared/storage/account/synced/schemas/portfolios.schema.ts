import z from 'zod';

import { PortfolioIdMnemonicBased, sPortfolio } from '@safely/core';
import { zArrayWithKey } from '@safely/sync';

export const sPortfolios = z.union([
    zArrayWithKey(sPortfolio, item =>
        new PortfolioIdMnemonicBased(item.id.type, item.id.hash, item.id.networkType).toString()
    ),
    z.null()
]);
