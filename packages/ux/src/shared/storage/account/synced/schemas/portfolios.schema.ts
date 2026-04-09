import z from 'zod';

import {
    PortfolioIdMnemonicBased,
    PortfolioIdWatchOnly,
    PortfolioType,
    sPortfolio
} from '@safely/core';
import { zArrayWithKey } from '@safely/sync';

export const sPortfolios = z.union([
    zArrayWithKey(sPortfolio, item => {
        if (item.type === PortfolioType.BIP39) {
            return new PortfolioIdMnemonicBased(item.id.hash, item.id.networkType).toString();
        }
        return new PortfolioIdWatchOnly(
            item.id.identifier,
            item.id.source,
            item.id.networkType,
            item.id.vmType
        ).toString();
    }),
    z.null()
]);
