import { Dispatch, useEffect, useRef } from 'react';

import { RatedCryptoAssetAmount } from '@safely/core';

import { SendFormAction, SendFormInitialValues } from '../types';
import { BLOCKCHAIN_DEFAULT_TOKENS, parseRecipient, recipientSchema } from '../utils';

interface UseSendFormRestorationParams {
    resolvedInitialValues: SendFormInitialValues | undefined;
    ratedAssets: RatedCryptoAssetAmount[];
    dispatch: Dispatch<SendFormAction>;
    setRecipient: (value: string) => void;
}

export function useSendFormRestoration(params: UseSendFormRestorationParams) {
    const { resolvedInitialValues, ratedAssets, dispatch, setRecipient } = params;

    const ratedAssetsRef = useRef(ratedAssets);
    ratedAssetsRef.current = ratedAssets;

    useEffect(() => {
        if (!resolvedInitialValues?.recipient) return;

        if (resolvedInitialValues.isMax) {
            const zodResult = recipientSchema.safeParse(resolvedInitialValues.recipient);
            if (!zodResult.success) return;

            const parsedRecipient = parseRecipient(zodResult.data);
            if (typeof parsedRecipient === 'string') return;

            const defaultAsset = BLOCKCHAIN_DEFAULT_TOKENS[parsedRecipient.blockchain];
            const parsedAsset = ratedAssetsRef.current.find(({ amount }) =>
                amount.asset.id.isEq(defaultAsset.id)
            );

            if (parsedAsset) {
                dispatch({
                    type: 'RESTORE_DRAFT',
                    recipient: parsedRecipient,
                    asset: parsedAsset,
                    assetId: defaultAsset.id.toString(),
                    amountInputType: resolvedInitialValues.amountInputType ?? 'crypto',
                    isMax: true,
                    stepIndex: resolvedInitialValues.stepIndex ?? 0
                });
                return;
            }
        }

        setRecipient(resolvedInitialValues.recipient);
    }, []);
}
