import { sActivePortfolioSchema } from './active-portfolio.schema';
import { sBroadcastedBtcTxCacheSchema } from './broadcasted-btc-tx-cache.schema';

export { type SBroadcastedBtcTx } from './broadcasted-btc-tx-cache.schema';

export const accountLocalStorageStructure = {
    activePortfolio: sActivePortfolioSchema,
    broadcastedBtcTxCache: sBroadcastedBtcTxCacheSchema
} as const;

export type AccountLocalStorageStructure = typeof accountLocalStorageStructure;
