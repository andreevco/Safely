import { useMutation, useQueryClient } from '@tanstack/react-query';

import { BtcTransactionTemplate, TransactionTemplate } from '@safely/core';

import { PendingBtcTx, useActiveBtcWallet, useBtcSendLocked } from '../../../entities';
import { utxo } from '../../../entities/btc-blockchain/keys';
import { useSetPendingBtcTransaction } from '../../../entities/btc-blockchain/pending-txs';

export function useSendAssetTransfer(transactionTemplate: TransactionTemplate | undefined) {
    const btcWallet = useActiveBtcWallet();
    const { mutateAsync: addPendingTx } = useSetPendingBtcTransaction();
    const queryClient = useQueryClient();
    const isLocked = useBtcSendLocked();

    return useMutation({
        async mutationFn() {
            if (!transactionTemplate) {
                throw new Error('Estimation not found');
            }

            if (isLocked) {
                throw new Error('Cannot send while pending transaction exists');
            }

            return transactionTemplate.send();
        },
        async onSuccess() {
            if (transactionTemplate instanceof BtcTransactionTemplate) {
                await addPendingTx(PendingBtcTx.fromTransactionTemplate(transactionTemplate));
                void queryClient.refetchQueries({
                    queryKey: utxo.wallet(btcWallet).toKey()
                });
                void queryClient.invalidateQueries({
                    queryKey: utxo.toKey()
                });
            }
        }
    });
}
