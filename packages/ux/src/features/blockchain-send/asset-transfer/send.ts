import { useMutation, useQueryClient } from '@tanstack/react-query';

import { BtcTransactionTemplate, TransactionTemplate } from '@safely/core';

import { BroadcastedBtcTx, useBtcSendLocked, useSetLastBroadcastedBtcTx } from '../../../entities';
import { utxo } from '../../../entities/btc-blockchain/keys';
import { refetchQueries } from '../../../shared';

export function useSendAssetTransfer(transactionTemplate: TransactionTemplate | undefined) {
    const { mutateAsync: setLastBroadcastedBtcTx } = useSetLastBroadcastedBtcTx();
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
                await setLastBroadcastedBtcTx(
                    BroadcastedBtcTx.fromTransactionTemplate(transactionTemplate)
                );
                void queryClient.invalidateQueries({ queryKey: utxo.toKey() });
                void refetchQueries(queryClient, utxo.toKey());
            }
        }
    });
}
