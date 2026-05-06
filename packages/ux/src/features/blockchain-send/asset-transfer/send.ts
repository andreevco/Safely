import type { TransactionTemplate } from '@safely/core';
import { BtcTransactionTemplate } from '@safely/core';

import {
    BroadcastedBtcTx,
    useBtcSendLocked,
    useMutation,
    useSetLastBroadcastedBtcTx
} from '../../../entities';

export function useSendAssetTransfer(transactionTemplate: TransactionTemplate | undefined) {
    const { mutateAsync: setLastBroadcastedBtcTx } = useSetLastBroadcastedBtcTx();
    const isLocked = useBtcSendLocked();

    return useMutation({
        async mutationFn() {
            if (!transactionTemplate) {
                throw new Error('Estimation not found');
            }

            if (isLocked) {
                throw new Error('Cannot send while broadcasted transaction cache exists');
            }

            return transactionTemplate.send();
        },
        async onSuccess() {
            if (transactionTemplate instanceof BtcTransactionTemplate) {
                await setLastBroadcastedBtcTx(
                    BroadcastedBtcTx.fromTransactionTemplate(transactionTemplate)
                );
            }
        }
    });
}
