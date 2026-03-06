import { useCallback, useEffect, useMemo, useReducer, useRef } from 'react';

import { useActivePortfolio, useAssets, usePortfolios } from '../../../../entities';
import { fuzzySearch, useNumberFormatter } from '../../../../shared';
import { useMaxSendAssetTransfer } from '../../../blockchain-send';
import { SendFormError } from '../errors';
import { createInitialState, sendFormReducer } from '../reducer';
import {
    AmountInputType,
    FormStepNames,
    SEND_STEPS,
    SendFormInitialValues,
    SendFormResult
} from '../types';
import {
    assetIdSchema,
    BLOCKCHAIN_DEFAULT_TOKENS,
    parseRecipient,
    recipientSchema
} from '../utils';
import { calculateMaxAmount, reformatForInputType, validateAmount } from '../validators';

const LAST_STEP_INDEX = SEND_STEPS.length - 1;

export interface UseSendFormOptions {
    onSubmit: (result: SendFormResult) => void;
    shouldResetForm?: boolean;
    initialValues?: SendFormInitialValues;
}

export function useSendForm(props: UseSendFormOptions) {
    const { onSubmit, shouldResetForm = true, initialValues } = props;

    const [state, dispatch] = useReducer(sendFormReducer, initialValues, createInitialState);
    const { data: maxSendValue, promise: maxSendValuePromise } = useMaxSendAssetTransfer(
        state.parsed.recipient
            ? {
                  recipient: state.parsed.recipient,
                  blockchain: state.parsed.recipient.blockchain
              }
            : undefined
    );

    const formatter = useNumberFormatter();
    const { data: assetsData } = useAssets();

    const skipNextAmountValidation = useRef(false);

    const ratedAssets = assetsData ?? [];
    const ratedAssetsRef = useRef(ratedAssets);
    ratedAssetsRef.current = ratedAssets;

    const blockchain = state.parsed.recipient?.blockchain;

    const portfolios = usePortfolios();
    const activePortfolio = useActivePortfolio();

    const suggestions = useMemo(() => {
        const others = portfolios.filter(p => !p.id.isEq(activePortfolio.id));
        return fuzzySearch(others, state.values.recipient, p => p.meta.name).slice(0, 8);
    }, [portfolios, activePortfolio, state.values.recipient]);

    const isMaxAvailable = useMemo(() => {
        const asset = state.parsed.asset;
        return asset ? !asset.amount.relativeAmount.eq(0) : false;
    }, [state.parsed.asset]);

    const availableAssets = useMemo(() => {
        if (!blockchain || !assetsData) return [];
        return assetsData
            .map(ratedAsset => ratedAsset.amount)
            .filter(({ asset }) => asset.id.blockchain === blockchain);
    }, [assetsData, blockchain]);

    const currentStepId = SEND_STEPS[state.stepIndex];

    const canGoToNextStep = useMemo(() => {
        if (currentStepId === FormStepNames.RECIPIENT) {
            return !!state.parsed.recipient && !state.errors.recipient;
        }

        if (currentStepId === FormStepNames.ASSET_AMOUNT) {
            return (
                !!state.parsed.amount &&
                !!state.parsed.asset &&
                !state.errors.amount &&
                !state.errors.asset
            );
        }

        return false;
    }, [state, currentStepId]);

    const validateRecipient = useCallback((value: string) => {
        dispatch({ type: 'RESET_DEPENDENT_FIELDS' });

        const zodResult = recipientSchema.safeParse(value);
        if (!zodResult.success) {
            dispatch({
                type: 'SET_RECIPIENT_VALIDATED',
                recipient: undefined,
                error: zodResult.error.issues[0]?.message ?? SendFormError.INVALID_RECIPIENT_ADDRESS
            });
            return;
        }

        const input = zodResult.data;
        const parsedRecipient = parseRecipient(input);

        if (typeof parsedRecipient === 'string') {
            dispatch({
                type: 'SET_RECIPIENT_VALIDATED',
                recipient: undefined,
                error: parsedRecipient
            });
            return;
        }

        dispatch({
            type: 'SET_RECIPIENT_VALIDATED',
            recipient: parsedRecipient,
            error: undefined
        });

        const defaultAsset = BLOCKCHAIN_DEFAULT_TOKENS[parsedRecipient.blockchain];
        const parsedAsset = ratedAssetsRef.current.find(({ amount }) =>
            amount.asset.id.isEq(defaultAsset.id)
        );

        if (parsedAsset) {
            dispatch({
                type: 'SET_ASSET',
                assetId: defaultAsset.id.toString(),
                asset: parsedAsset,
                error: undefined
            });
        }
    }, []);

    const setRecipient = useCallback(
        (value: string, label?: string) => {
            dispatch({ type: 'SET_RECIPIENT', value, label });
            validateRecipient(value);
        },
        [validateRecipient]
    );

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
        [state.parsed.asset, state.values.amountInputType, formatter]
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
        [state.parsed.amount, state.errors.amount, formatter]
    );

    const setIsMax = useCallback(
        async (isMax: boolean): Promise<string | void> => {
            dispatch({ type: 'SET_IS_MAX', value: isMax });

            if (!isMax) {
                skipNextAmountValidation.current = false;
                return;
            }

            const asset = state.parsed.asset;
            if (!asset) return;

            const result = calculateMaxAmount(
                { amount: maxSendValue ?? (await maxSendValuePromise), price: asset.price },
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

            return result.formatted;
        },
        [
            state.parsed.asset,
            state.values.amountInputType,
            formatter,
            maxSendValue,
            maxSendValuePromise
        ]
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
        [state.parsed.amount]
    );

    const reset = useCallback(() => {
        dispatch({ type: 'RESET' });
    }, []);

    const goPrev = useCallback(() => {
        dispatch({ type: 'PREV_STEP' });
    }, []);

    const submitOrNextStep = useCallback(() => {
        const isLast = state.stepIndex === LAST_STEP_INDEX;

        if (!isLast) {
            dispatch({ type: 'NEXT_STEP' });
            return;
        }

        if (!state.parsed.recipient || !state.parsed.amount || !state.parsed.asset) return;

        if (state.errors.amount || state.errors.asset) {
            dispatch({ type: 'PREV_STEP' });
            return;
        }

        const result: SendFormResult = {
            blockchain: state.parsed.recipient.blockchain,
            recipient: state.parsed.recipient,
            amount: state.parsed.amount,
            isMax: state.parsed.isMax
        };

        onSubmit(result);

        if (shouldResetForm) {
            dispatch({ type: 'RESET' });
        }
    }, [state, onSubmit, shouldResetForm]);

    useEffect(() => {
        if (initialValues?.recipient) {
            setRecipient(initialValues.recipient);
        }
    }, []);

    useEffect(() => {
        if (initialValues?.amount && state.parsed.asset && !state.parsed.amount) {
            setAmount(initialValues.amount);
        }
    }, [state.parsed.asset]);

    return {
        state,
        actions: {
            setRecipient,
            setAmount,
            setAmountInputType,
            setIsMax,
            setAsset,
            reset
        },
        step: {
            index: state.stepIndex,
            id: currentStepId,
            prev: goPrev,
            next: submitOrNextStep,
            canGoNext: canGoToNextStep
        },
        meta: {
            isMaxAvailable,
            availableAssets,
            suggestions
        }
    };
}
