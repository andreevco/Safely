import { Dispatch, useCallback, useEffect, useRef } from 'react';

import { BtcAssetAmount, RatedCryptoAssetAmount } from '@safely/core';

import { useNumberFormatter } from '../../../../shared';
import { SendFormError } from '../errors';
import { AmountInputType, SendFormAction, SendFormInitialValues, SendFormState } from '../types';
import { assetIdSchema } from '../utils';
import { calculateMaxAmount, reformatForInputType, validateAmount } from '../validators';

interface UseAmountActionsParams {
    dispatch: Dispatch<SendFormAction>;
    state: SendFormState;
    formatter: ReturnType<typeof useNumberFormatter>;
    maxSendValue: BtcAssetAmount | undefined;
    ratedAssets: RatedCryptoAssetAmount[];
    resolvedInitialValues: SendFormInitialValues | undefined;
}

export function useAmountActions(params: UseAmountActionsParams) {
    const { dispatch, state, formatter, maxSendValue, ratedAssets, resolvedInitialValues } = params;

    const skipNextAmountValidation = useRef(false);

    const ratedAssetsRef = useRef(ratedAssets);
    ratedAssetsRef.current = ratedAssets;

    const setAmount = useCallback(
        (value: string) => {
            if (skipNextAmountValidation.current) {
                skipNextAmountValidation.current = false;
                return;
            }

            dispatch({ type: 'SET_AMOUNT', value });

            const result = validateAmount(
                value,
                state.values.amountInputType,
                state.parsed.asset,
                formatter
            );
            dispatch({ type: 'SET_AMOUNT_VALIDATED', ...result });
        },
        [dispatch, state.parsed.asset, state.values.amountInputType, formatter]
    );

    const setAmountInputType = useCallback(
        (value: AmountInputType) => {
            dispatch({ type: 'SET_AMOUNT_INPUT_TYPE', value });

            const currentParsed = state.parsed.amount;
            if (!currentParsed?.fiatAssetAmount) return;

            const result = reformatForInputType(currentParsed, value, formatter);
            if (result) {
                dispatch({
                    type: 'SET_AMOUNT_VALIDATED',
                    parsed: result.parsed,
                    formatted: result.formatted,
                    error: state.errors.amount
                });
            }
        },
        [dispatch, state.parsed.amount, state.errors.amount, formatter]
    );

    const setIsMax = useCallback(
        (isMax: boolean) => {
            dispatch({ type: 'SET_IS_MAX', value: isMax });

            if (!isMax) {
                skipNextAmountValidation.current = false;
                return;
            }

            const asset = state.parsed.asset;
            if (!asset || !maxSendValue) return;

            const result = calculateMaxAmount(
                { amount: maxSendValue, price: asset.price },
                state.values.amountInputType,
                formatter
            );
            if (!result) return;

            dispatch({
                type: 'SET_AMOUNT_VALIDATED',
                parsed: result.parsed,
                formatted: result.formatted,
                error: undefined
            });

            skipNextAmountValidation.current = true;
        },
        [dispatch, state.parsed.asset, state.values.amountInputType, formatter, maxSendValue]
    );

    const setAsset = useCallback(
        (assetId: string) => {
            const zodResult = assetIdSchema.safeParse(assetId);
            if (!zodResult.success) {
                dispatch({
                    type: 'SET_ASSET',
                    assetId,
                    asset: undefined,
                    error: zodResult.error.issues[0]?.message ?? SendFormError.SELECT_TOKEN
                });

                return;
            }

            const parsedAsset = ratedAssetsRef.current.find(
                ({ amount }) => amount.asset.id.toString() === zodResult.data
            );

            if (!parsedAsset) {
                dispatch({
                    type: 'SET_ASSET',
                    assetId,
                    asset: undefined,
                    error: SendFormError.UNABLE_TO_VALIDATE_TOKEN
                });
                return;
            }

            dispatch({ type: 'SET_ASSET', assetId, asset: parsedAsset, error: undefined });

            if (state.parsed.amount) {
                dispatch({ type: 'SET_IS_MAX', value: false });
                dispatch({
                    type: 'SET_AMOUNT_VALIDATED',
                    parsed: undefined,
                    formatted: '',
                    error: undefined
                });
            }
        },
        [dispatch, state.parsed.amount]
    );

    useEffect(() => {
        if (!state.parsed.isMax) return;
        if (state.parsed.amount) return;
        if (!state.parsed.asset || !maxSendValue) return;

        const result = calculateMaxAmount(
            { amount: maxSendValue, price: state.parsed.asset.price },
            state.values.amountInputType,
            formatter
        );
        if (!result) return;

        dispatch({
            type: 'SET_AMOUNT_VALIDATED',
            parsed: result.parsed,
            formatted: result.formatted,
            error: undefined
        });
        skipNextAmountValidation.current = true;
    }, [
        dispatch,
        state.parsed.isMax,
        state.parsed.amount,
        state.parsed.asset,
        state.values.amountInputType,
        formatter,
        maxSendValue
    ]);

    useEffect(() => {
        if (!state.parsed.asset) return;
        if (state.parsed.amount) return;
        if (state.parsed.isMax) return;

        if (resolvedInitialValues?.amount) {
            setAmount(resolvedInitialValues.amount);
        }
    }, [state.parsed.asset]);

    return { setAmount, setAmountInputType, setIsMax, setAsset };
}
