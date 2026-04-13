import z from 'zod';

import {
    assertUnreachable,
    PortfolioIdMnemonicBased,
    PortfolioIdWatchOnly,
    PortfolioType,
    sPortfolio
} from '@safely/core';
import { zArrayWithKey } from '@safely/sync';

export const sPortfolios = z.union([
    zArrayWithKey(sPortfolio, item => {
        switch (item.type) {
            case PortfolioType.BIP39:
                return new PortfolioIdMnemonicBased(item.id.hash, item.id.networkType).toString();
            case PortfolioType.WATCH_ONLY:
                return new PortfolioIdWatchOnly(
                    item.id.identifier,
                    item.id.source,
                    item.id.networkType,
                    item.id.vmType
                ).toString();
            default:
                assertUnreachable(item);
        }
    }),
    z.null()
]);
