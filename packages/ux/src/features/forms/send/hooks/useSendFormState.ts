import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';

import { useActiveBtcWallet, useAssets } from '../../../../entities';
import { useNumberFormatter } from '../../../../shared';
import { useMaxSendAssetTransfer } from '../../../blockchain-send';
import { SendFormError } from '../errors';
import { createInitialState, sendFormReducer } from '../reducer';
import {
    AmountInputType,
    FormStepNames,
    SEND_STEPS,
    SendFormInitialValues,
    SendFormResult,
    SendSuggestion,
    SendSuggestionState
} from '../types';
import {
    assetIdSchema,
    BLOCKCHAIN_DEFAULT_TOKENS,
    parseRecipient,
    recipientSchema
} from '../utils';
import { calculateMaxAmount, reformatForInputType, validateAmount } from '../validators';

const LAST_STEP_INDEX = SEND_STEPS.length - 1;

export interface UseSendFormStateParams {
    resolvedInitialValues: SendFormInitialValues | undefined;
    draftSuggestion?: SendSuggestionState;
    onSubmit: (result: SendFormResult, onSuccess: () => void) => void;
    shouldResetForm: boolean;
    clearDraft: () => void;
}

export function useSendFormState(params: UseSendFormStateParams) {
    const { resolvedInitialValues, draftSuggestion, onSubmit, shouldResetForm, clearDraft } =
        params;

    const [state, dispatch] = useReducer(sendFormReducer, undefined, () =>
        createInitialState(resolvedInitialValues, draftSuggestion)
    );

    const [isSubmitted, setIsSubmitted] = useState(false);

    const { data: maxSendValue } = useMaxSendAssetTransfer(
        state.parsed.recipient
            ? {
                  recipient: state.parsed.recipient,
                  blockchain: state.parsed.recipient.blockchain
              }
            : undefined,
        { enabled: !isSubmitted }
    );

    const formatter = useNumberFormatter();
    const { data: assetsData } = useAssets();

    const skipNextAmountValidation = useRef(false);

    const ratedAssets = assetsData ?? [];
    const ratedAssetsRef = useRef(ratedAssets);
    ratedAssetsRef.current = ratedAssets;

    const activeBtcWallet = useActiveBtcWallet();
    const activeBtcWalletRef = useRef(activeBtcWallet);
    activeBtcWalletRef.current = activeBtcWallet;

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

        if (value.trim().length < 5) {
            dispatch({
                type: 'SET_RECIPIENT_VALIDATED',
                recipient: undefined,
                error: undefined
            });
            return;
        }

        const zodResult = recipientSchema.safeParse(value);
        if (!zodResult.success) {
            dispatch({
                type: 'SET_RECIPIENT_VALIDATED',
                recipient: undefined,
                error: zodResult.error.issues[0]?.message ?? SendFormError.INVALID_WALLET_ADDRESS
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

        if (parsedRecipient.address === activeBtcWalletRef.current.address) {
            dispatch({
                type: 'SET_RECIPIENT_VALIDATED',
                recipient: undefined,
                error: SendFormError.SELF_TRANSFER
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
        (value: string) => {
            dispatch({ type: 'SET_RECIPIENT', value });
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
        [state.parsed.asset, state.values.amountInputType, formatter, maxSendValue]
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

    const selectSuggestion = useCallback(
        (id: string, visible: SendSuggestion[]) => {
            const picked = visible.find(s => s.id === id);
            if (!picked) return;

            dispatch({
                type: 'SELECT_SUGGESTION',
                id,
                address: picked.address,
                label: picked.meta.name,
                suggestionIds: visible.map(s => s.id)
            });
            validateRecipient(picked.address);
        },
        [validateRecipient]
    );

    const clearSuggestion = useCallback(() => {
        dispatch({ type: 'CLEAR_SUGGESTION' });
    }, []);

    const reset = useCallback(() => {
        setIsSubmitted(false);
        dispatch({ type: 'RESET' });
        clearDraft();
    }, [clearDraft]);

    const onBackToEditing = useCallback(() => {
        setIsSubmitted(false);
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

        setIsSubmitted(true);
        onSubmit(result, clearDraft);

        if (shouldResetForm) {
            dispatch({ type: 'RESET' });
        }
    }, [state, onSubmit, shouldResetForm, clearDraft]);

    // --- Restoration effects ---

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
    }, [state.parsed.isMax, state.parsed.amount, state.parsed.asset, maxSendValue]);

    useEffect(() => {
        if (!state.parsed.asset) return;
        if (state.parsed.amount) return;
        if (state.parsed.isMax) return;

        if (resolvedInitialValues?.amount) {
            setAmount(resolvedInitialValues.amount);
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
            selectSuggestion,
            clearSuggestion,
            reset,
            onBackToEditing
        },
        step: {
            index: state.stepIndex,
            id: currentStepId,
            prev: goPrev,
            next: submitOrNextStep,
            canGoNext: canGoToNextStep
        },
        assetsData
    };
}
