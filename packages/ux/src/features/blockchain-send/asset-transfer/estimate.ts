import { skipToken, useQuery } from '@tanstack/react-query';

import {
    assertUnreachable,
    BLOCKCHAIN_NAME,
    BTC_ASSET,
    BtcAssetAmount,
    BtcEstimator,
    BtcFeeType,
    RatedCryptoAssetAmount,
    TransactionTemplate
} from '@safely/core';

import { useAssets } from '../../../entities';
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

export const maxSendKey = defineQueryKeys('maxSendKey', {
    form(__: Pick<SendFormResult, 'blockchain' | 'recipient'> | undefined) {
        return {
            services: mappedParams(
                (_: { btcEstimator: BtcEstimator; assets: RatedCryptoAssetAmount[] | undefined }) =>
                    finalKey,
                p => [p.btcEstimator.id, JSON.stringify(p.assets)]
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
                const recipientAddress = form.recipient.address;
                const feeType = BtcFeeType.FAST;

                return btcEstimator.estimate(
                    form.isMax
                        ? {
                              type: 'max',
                              recipientAddress,
                              estimatedAmount: form.amount.cryptoAssetAmount,
                              feeType
                          }
                        : {
                              type: 'not-max',
                              recipientAddress,
                              feeType,
                              amount: form.amount.cryptoAssetAmount
                          }
                );
            }

            assertUnreachable(form.blockchain);
        },
        refetchInterval: QUERIES_REFETCH_INTERVAL.TRANSACTION,
        refetchOnMount: 'always',
        retry: 2
    });
}

export function useMaxSendAssetTransfer(
    form: Pick<SendFormResult, 'blockchain' | 'recipient'> | undefined
) {
    const btcEstimator = useBtcEstimator();
    const { data: assets } = useAssets();

    return useQuery({
        queryKey: maxSendKey.form(form).services({ btcEstimator, assets }).toKey(),
        queryFn: form
            ? async () => {
                  if (form.blockchain === BLOCKCHAIN_NAME.BTC) {
                      const fee = await btcEstimator.getSendFee({
                          recipientAddress: form.recipient.address,
                          feeType: BtcFeeType.FAST
                      });

                      const btcBalance = assets?.find(a => a.amount.asset.id.isEq(BTC_ASSET.id));
                      if (!btcBalance) {
                          throw new Error('BTC asset not found');
                      }

                      if (btcBalance.amount.lte(fee)) {
                          return BtcAssetAmount.fromWeiAmount('0');
                      }

                      return btcBalance.amount.amountSub(fee);
                  }

                  assertUnreachable(form.blockchain);
              }
            : skipToken,
        refetchInterval: QUERIES_REFETCH_INTERVAL.TRANSACTION,
        refetchOnMount: 'always',
        retry: 2
    });
}
