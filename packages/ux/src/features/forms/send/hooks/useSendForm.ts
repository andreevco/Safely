import { useEffect, useMemo, useState } from 'react';

import { usePortfolios } from '../../../../entities';
import { SendFormInitialValues, SendFormResult, SendSuggestionState } from '../types';
import { mapPortfolioToSuggestions } from '../utils';
import { useSendFormDraft } from './useSendFormDraft';
import { useSendFormMeta } from './useSendFormMeta';
import { useSendFormState } from './useSendFormState';

export interface UseSendFormOptions {
    onSubmit: (result: SendFormResult, onSuccess: () => void) => void;
    shouldResetForm?: boolean;
    initialValues?: SendFormInitialValues;
}

export function useSendForm(props: UseSendFormOptions) {
    const { onSubmit, shouldResetForm = true, initialValues } = props;

    const portfolios = usePortfolios();
    const { initialDraft, saveDraft, clearDraft } = useSendFormDraft();

    const allSuggestions = useMemo(
        () => portfolios.flatMap(p => mapPortfolioToSuggestions(p)),
        [portfolios]
    );

    const [resolvedInitialValues] = useState<SendFormInitialValues | undefined>(() => {
        if (initialValues?.recipient) return initialValues;

        return initialDraft ?? initialValues;
    });

    const [initialSuggestion] = useState<SendSuggestionState | undefined>(() => {
        const address = resolvedInitialValues?.recipient;
        if (!address) return undefined;

        const match = allSuggestions.find(s => s.address === address);
        if (!match) return undefined;

        return {
            selectedId: match.id,
            suggestionIds: allSuggestions.map(s => s.id)
        };
    });

    const { state, actions, step, assetsData } = useSendFormState({
        resolvedInitialValues,
        initialSuggestion,
        allSuggestions,
        onSubmit,
        shouldResetForm,
        clearDraft
    });

    const meta = useSendFormMeta({
        state,
        assetsData,
        allSuggestions
    });

    useEffect(() => {
        if (state.values.recipient) {
            saveDraft({
                recipient: state.values.recipient,
                amount: state.values.amount || undefined,
                amountInputType: state.values.amountInputType,
                isMax: state.values.isMax || undefined,
                stepIndex: state.stepIndex
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
        saveDraft,
        clearDraft
    ]);

    const suggestionSelection = useMemo(
        () => ({
            selectedId: state.suggestion.selectedId,
            select: actions.selectSuggestion,
            clear: actions.clearSuggestion
        }),
        [state.suggestion.selectedId, actions.selectSuggestion, actions.clearSuggestion]
    );

    return {
        state,
        actions,
        step,
        meta,
        suggestionSelection
    };
}
