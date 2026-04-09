import { useMutation, useQueryClient } from '@tanstack/react-query';

import { BtcTransactionTemplate, TransactionTemplate } from '@safely/core';

import { BroadcastedBtcTx, useBtcSendLocked } from '../../../entities';
import { useSetBroadcastedBtcTxCache } from '../../../entities/btc-blockchain/broadcasted-tx-cache';
import { utxo } from '../../../entities/btc-blockchain/keys';
import { refetchQueries } from '../../../shared';

export function useSendAssetTransfer(transactionTemplate: TransactionTemplate | undefined) {
    const { mutateAsync: setBroadcastedTx } = useSetBroadcastedBtcTxCache();
    const queryClient = useQueryClient();
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
                await setBroadcastedTx(
                    BroadcastedBtcTx.fromTransactionTemplate(transactionTemplate)
                );
                void refetchQueries(queryClient, utxo.toKey());
            }
        }
    });
}
