import { BtcApiTx } from '@safely/core';

import { useActualBtcBlockNumber } from '../../btc-blockchain';

type BtcTransactionDisplayStatus =
    | { type: 'pending' }
    | { type: 'confirmed-recently'; timestamp: Date; confirmations: number }
    | { type: 'confirmed-long-ago'; timestamp: Date };

export function useBtcTransactionDisplayStatus(
    tx: Pick<BtcApiTx, 'blockHeight' | 'confirmations' | 'blockTime'>
): BtcTransactionDisplayStatus {
    const { data: currentBlockNumber } = useActualBtcBlockNumber();

    if (tx.blockHeight === -1) {
        return { type: 'pending' };
    } else {
        const timestamp = new Date(tx.blockTime * 1000);
        const confirmations =
            currentBlockNumber !== undefined
                ? currentBlockNumber - tx.blockHeight + 1
                : tx.confirmations;
        const confirmedAgoConfirmationsNumber = 6;

        if (confirmations > confirmedAgoConfirmationsNumber) {
            return { type: 'confirmed-long-ago', timestamp };
        } else {
            return { type: 'confirmed-recently', confirmations, timestamp };
        }
    }
}
