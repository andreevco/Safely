import { sActivePortfolioSchema } from './active-portfolio.schema';
import { sPendingBtcTxsSchema } from './pending-btc-txs.schema';

export { type SPendingBtcTx } from './pending-btc-txs.schema';

export const accountLocalStorageStructure = {
    activePortfolio: sActivePortfolioSchema,
    pendingBtcTxs: sPendingBtcTxsSchema
} as const;

export type AccountLocalStorageStructure = typeof accountLocalStorageStructure;
