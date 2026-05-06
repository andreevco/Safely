import { useEffect, useMemo } from 'react';

import type { SendFormInitialValues, SendFormResult } from '../types';
import { useSendFormDraft } from './useSendFormDraft';
import { useSendFormMeta } from './useSendFormMeta';
import { useSendFormState } from './useSendFormState';
import { useSuggestionDraft } from './useSuggestionDraft';

export interface UseSendFormOptions {
    onSubmit: (result: SendFormResult, onSuccess: () => void) => void;
    shouldResetForm?: boolean;
    initialValues?: SendFormInitialValues;
}

export function useSendForm(props: UseSendFormOptions) {
    const { onSubmit, shouldResetForm = true, initialValues } = props;

    const { initialDraft, saveDraft, clearDraft } = useSendFormDraft();

    const resolvedInitialValues = useMemo(() => {
        if (initialValues?.recipient) return initialValues;

        return initialDraft ?? initialValues;
    }, []);

    const { state, actions, step, assetsData } = useSendFormState({
        resolvedInitialValues,
        onSubmit,
        shouldResetForm,
        clearDraft
    });

    const suggestionDraft = useSuggestionDraft(initialDraft);

    const meta = useSendFormMeta({
        state,
        assetsData,
        suggestionDraft: suggestionDraft.state
    });

    useEffect(() => {
        if (state.values.recipient) {
            saveDraft({
                recipient: state.values.recipient,
                amount: state.values.amount || undefined,
                amountInputType: state.values.amountInputType,
                isMax: state.values.isMax || undefined,
                stepIndex: state.stepIndex,
                ...suggestionDraft.state
            });
        } else {
            clearDraft();
        }
    }, [
        state.values.recipient,
        state.values.amount,
        state.values.amountInputType,
        state.values.isMax,
        state.stepIndex,
        suggestionDraft.state.selectedId,
        suggestionDraft.state.suggestionPortfoliosIds,
        suggestionDraft.state.suggestionContactsIds
    ]);

    return {
        state,
        actions,
        step,
        meta,
        suggestionSelection: suggestionDraft.actions
    };
}
