import { useEffect, useMemo } from 'react';

import { SendFormInitialValues, SendFormResult } from '../types';
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

    const meta = useSendFormMeta({ state, assetsData });

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
        state.stepIndex
    ]);

    return {
        state,
        actions,
        step,
        meta
    };
}
