import { useQuery } from '@tanstack/react-query';

import { assertUnreachable, TransactionTemplate } from '@safely/core';
import { BtcEstimator } from '@safely/core/blockchain-api';
import { BtcFeeType } from '@safely/core/blockchain-api/btc/types';
import { BLOCKCHAIN_NAME } from '@safely/core/entities';

import { defineQueryKeys, finalKey, mappedParams, QUERIES_REFETCH_INTERVAL } from '../../../shared';
import { SendFormResult } from '../../forms';
import { useBtcEstimator } from '../btc/estimator';

export const estimationKey = defineQueryKeys('estimation', {
    form(__: SendFormResult) {
        return {
            services: mappedParams(
                (_: { btcEstimator: BtcEstimator }) => finalKey,
                p => [p.btcEstimator.id]
            )
        };
    }
});

export function useEstimateAssetTransfer(form: SendFormResult) {
    const btcEstimator = useBtcEstimator();

    return useQuery<TransactionTemplate>({
        queryKey: estimationKey.form(form).services({ btcEstimator }).toKey(),
        async queryFn() {
            if (form.blockchain === BLOCKCHAIN_NAME.BTC) {
                return btcEstimator.estimate({
                    recipientAddress: form.recipient.address,
                    amount: form.amount.cryptoAssetAmount,
                    feeType: BtcFeeType.FAST
                });
            }

            assertUnreachable(form.blockchain);
        },
        refetchInterval: QUERIES_REFETCH_INTERVAL.TRANSACTION,
        refetchOnMount: 'always',
        retry: 2
    });
}
