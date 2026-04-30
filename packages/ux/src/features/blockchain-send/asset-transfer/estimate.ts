import { keepPreviousData, skipToken, useQuery } from '@tanstack/react-query';

import {
    assertUnreachable,
    BLOCKCHAIN_NAME,
    BTC_ASSET,
    BtcAssetAmount,
    BtcEstimator,
    BtcFeeType,
    RatedCryptoAssetAmount,
    TransactionTemplate,
    BtcApiUtxo,
    OutputsAreSpendingMoreThanInputsError
} from '@safely/core';

import { useActiveBtcWalletUtxoForEstimation, useAssets } from '../../../entities';
import { QUERIES_REFETCH_INTERVAL } from '../../../shared';
import {
    defineQueryKeys,
    finalKey,
    mappedParams
} from '../../../shared/query-core/query-key-factory';
import type { SendFormResult } from '../../forms/send/types';
import { useBtcEstimator } from '../btc/estimator';

export const estimationKey = defineQueryKeys('estimation', {
    form(__: SendFormResult) {
        return {
            params: mappedParams(
                (_: { btcEstimator: BtcEstimator; utxos: BtcApiUtxo[] | undefined }) => finalKey,
                p => [p.btcEstimator.id, JSON.stringify(p.utxos)]
            )
        };
    }
});

export const maxSendKey = defineQueryKeys('maxSendKey', {
    form(__: Pick<SendFormResult, 'blockchain' | 'recipient'> | undefined) {
        return {
            params: mappedParams(
                (_: {
                    btcEstimator: BtcEstimator;
                    assets: RatedCryptoAssetAmount[] | undefined;
                    utxos: BtcApiUtxo[] | undefined;
                }) => finalKey,
                p => [p.btcEstimator.id, JSON.stringify(p.assets), JSON.stringify(p.utxos)]
            )
        };
    }
});

export function useEstimateAssetTransfer(form: SendFormResult, options?: { enabled?: boolean }) {
    const btcEstimator = useBtcEstimator();
    const { data: utxos } = useActiveBtcWalletUtxoForEstimation();

    return useQuery<TransactionTemplate>({
        queryKey: estimationKey.form(form).params({ btcEstimator, utxos }).toKey(),
        queryFn:
            utxos !== undefined && options?.enabled !== false
                ? async () => {
                      if (form.blockchain === BLOCKCHAIN_NAME.BTC) {
                          const recipientAddress = form.recipient.address;
                          const feeType = BtcFeeType.FAST;

                          try {
                              return await btcEstimator.estimate(
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
                                        },
                                  utxos
                              );
                          } catch (error) {
                              if (
                                  error instanceof Error &&
                                  error.message.includes('Outputs are spending more than Inputs')
                              ) {
                                  throw new OutputsAreSpendingMoreThanInputsError();
                              }
                              throw error;
                          }
                      }

                      assertUnreachable(form.blockchain);
                  }
                : skipToken,
        refetchInterval: QUERIES_REFETCH_INTERVAL.TRANSACTION,
        refetchOnMount: 'always',
        placeholderData: keepPreviousData,
        retry: 2
    });
}

export function useMaxSendAssetTransfer(
    form: Pick<SendFormResult, 'blockchain' | 'recipient'> | undefined,
    options?: { enabled?: boolean }
) {
    const btcEstimator = useBtcEstimator();
    const { data: assets } = useAssets();
    const { data: utxos } = useActiveBtcWalletUtxoForEstimation();

    return useQuery({
        queryKey: maxSendKey.form(form).params({ btcEstimator, assets, utxos }).toKey(),
        queryFn:
            form && utxos && assets && options?.enabled !== false
                ? async () => {
                      if (form.blockchain === BLOCKCHAIN_NAME.BTC) {
                          const fee = await btcEstimator.getSendFee(
                              {
                                  recipientAddress: form.recipient.address,
                                  feeType: BtcFeeType.FAST
                              },
                              utxos
                          );

                          const btcBalance = assets?.find(a =>
                              a.amount.asset.id.isEq(BTC_ASSET.id)
                          );
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
        placeholderData: keepPreviousData,
        retry: 2
    });
}
