import { useCallback, useMemo, useReducer, useState } from 'react';

import { useActiveBtcWallet, useAssets } from '../../../../entities';
import { useNumberFormatter } from '../../../../shared';
import { useMaxSendAssetTransfer } from '../../../blockchain-send';
import { createInitialState, sendFormReducer } from '../reducer';
import {
    FormStepNames,
    SEND_STEPS,
    SendFormInitialValues,
    SendFormResult,
    SendSuggestion,
    SendSuggestionState
} from '../types';
import { useAmountActions } from './useAmountActions';
import { useRecipientValidation } from './useRecipientValidation';
import { useSendFormRestoration } from './useSendFormRestoration';

const LAST_STEP_INDEX = SEND_STEPS.length - 1;

export interface UseSendFormStateParams {
    resolvedInitialValues: SendFormInitialValues | undefined;
    initialSuggestion?: SendSuggestionState;
    allSuggestions: SendSuggestion[];
    onSubmit: (result: SendFormResult, onSuccess: () => void) => void;
    shouldResetForm: boolean;
    clearDraft: () => void;
}

export function useSendFormState(params: UseSendFormStateParams) {
    const {
        resolvedInitialValues,
        initialSuggestion,
        allSuggestions,
        onSubmit,
        shouldResetForm,
        clearDraft
    } = params;

    const [state, dispatch] = useReducer(sendFormReducer, undefined, () =>
        createInitialState(resolvedInitialValues, initialSuggestion)
    );

    const [isSubmitted, setIsSubmitted] = useState(false);

    const { data: assetsData } = useAssets();
    const ratedAssets = assetsData ?? [];
    const formatter = useNumberFormatter();
    const activeBtcWallet = useActiveBtcWallet();

    const { data: maxSendValue } = useMaxSendAssetTransfer(
        state.parsed.recipient
            ? {
                  recipient: state.parsed.recipient,
                  blockchain: state.parsed.recipient.blockchain
              }
            : undefined,
        { enabled: !isSubmitted }
    );

    const { setRecipient, selectSuggestion, clearSuggestion } = useRecipientValidation({
        dispatch,
        ratedAssets,
        activeWalletAddress: activeBtcWallet.address,
        allSuggestions
    });

    const { setAmount, setAmountInputType, setIsMax, setAsset } = useAmountActions({
        dispatch,
        state,
        formatter,
        maxSendValue,
        ratedAssets,
        resolvedInitialValues
    });

    useSendFormRestoration({
        resolvedInitialValues,
        ratedAssets,
        dispatch,
        setRecipient
    });

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
