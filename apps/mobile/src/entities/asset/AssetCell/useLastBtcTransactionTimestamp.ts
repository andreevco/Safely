import { BLOCKCHAIN_NAME } from '@safely/core';
import { useHistory } from '@safely/ux';

export function useLastBtcTransactionTimestamp() {
    return useHistory(
        {},
        {
            select: data => {
                const items = data?.pages?.flatMap(page => page.items) ?? [];
                const btcItem = items.find(
                    item => item.transaction.value.asset.id.blockchain === BLOCKCHAIN_NAME.BTC
                );
                return btcItem?.timestamp ?? null;
            }
        }
    );
}
