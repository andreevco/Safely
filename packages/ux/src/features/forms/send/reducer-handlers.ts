import { SendFormAction, SendFormState, SendSuggestionState } from './types';

export const EMPTY_SUGGESTION: SendSuggestionState = {
    selectedId: undefined,
    suggestionIds: undefined
};

export function withResetDependentFields(state: SendFormState): SendFormState {
    return {
        ...state,
        values: { ...state.values, amount: '', assetId: '', isMax: false },
        parsed: { ...state.parsed, amount: undefined, asset: undefined, isMax: false },
        errors: { ...state.errors, amount: undefined, asset: undefined }
    };
}

export function applyValidateRecipientResult(
    state: SendFormState,
    action: Extract<SendFormAction, { type: 'VALIDATE_RECIPIENT_RESULT' }>
): SendFormState {
    const reset = withResetDependentFields(state);

    return {
        ...reset,
        values: {
            ...reset.values,
            assetId: action.asset?.assetId ?? reset.values.assetId
        },
        parsed: {
            ...reset.parsed,
            recipient: action.recipient,
            asset: action.asset?.asset ?? reset.parsed.asset
        },
        errors: { ...reset.errors, recipient: action.error },
        suggestion: action.suggestion
            ? { selectedId: action.suggestion.id, suggestionIds: action.suggestion.suggestionIds }
            : state.suggestion
    };
}

export function applySelectSuggestion(
    state: SendFormState,
    action: Extract<SendFormAction, { type: 'SELECT_SUGGESTION' }>
): SendFormState {
    const recipientChanged = state.values.recipient !== action.address;
    const base = recipientChanged ? withResetDependentFields(state) : state;

    return {
        ...base,
        values: {
            ...base.values,
            recipient: action.address,
            recipientLabel: action.label ?? base.values.recipientLabel
        },
        suggestion: {
            selectedId: action.id,
            suggestionIds: action.suggestionIds
        }
    };
}

export function applySetRecipient(
    state: SendFormState,
    action: Extract<SendFormAction, { type: 'SET_RECIPIENT' }>
): SendFormState {
    const recipientChanged = state.values.recipient !== action.value;

    return {
        ...state,
        values: {
            ...state.values,
            recipient: action.value,
            recipientLabel: action.label
        },
        suggestion: recipientChanged ? EMPTY_SUGGESTION : state.suggestion
    };
}

export function applyClearSuggestion(state: SendFormState): SendFormState {
    return { ...state, suggestion: EMPTY_SUGGESTION };
}

export function applyRestoreDraft(
    state: SendFormState,
    action: Extract<SendFormAction, { type: 'RESTORE_DRAFT' }>
): SendFormState {
    return {
        values: {
            ...state.values,
            amountInputType: action.amountInputType,
            assetId: action.assetId,
            isMax: action.isMax,
            amount: ''
        },
        parsed: {
            recipient: action.recipient,
            asset: action.asset,
            amount: undefined,
            isMax: action.isMax
        },
        errors: {
            recipient: undefined,
            amount: undefined,
            asset: undefined
        },
        stepIndex: action.stepIndex,
        suggestion: state.suggestion
    };
}
