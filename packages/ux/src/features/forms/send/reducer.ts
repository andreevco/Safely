import {
    applyClearSuggestion,
    applyRestoreDraft,
    applySelectSuggestion,
    applySetRecipient,
    applyValidateRecipientResult,
    EMPTY_SUGGESTION
} from './reducer-handlers';
import {
    SendFormAction,
    SendFormInitialValues,
    SendFormState,
    SendFormValues,
    SendSuggestionState,
    SEND_STEPS
} from './types';

const LAST_STEP_INDEX = SEND_STEPS.length - 1;

const DEFAULT_VALUES: SendFormValues = {
    recipient: '',
    addressBookName: '',
    recipientLabel: undefined,
    amount: '',
    amountInputType: 'crypto',
    isMax: false,
    assetId: ''
};

export const INITIAL_STATE: SendFormState = {
    values: DEFAULT_VALUES,
    parsed: {
        recipient: undefined,
        amount: undefined,
        asset: undefined,
        isMax: false
    },
    errors: {
        recipient: undefined,
        amount: undefined,
        asset: undefined
    },
    stepIndex: 0,
    suggestion: EMPTY_SUGGESTION
};

export function createInitialState(
    initialValues?: SendFormInitialValues,
    draftSuggestion?: SendSuggestionState
): SendFormState {
    if (!initialValues?.recipient) return INITIAL_STATE;

    const allDraftIds = [
        ...(draftSuggestion?.portfoliosIds ?? []),
        ...(draftSuggestion?.contactsIds ?? [])
    ];
    const hasValidSuggestion =
        !!draftSuggestion?.selectedId && allDraftIds.includes(draftSuggestion.selectedId);

    return {
        ...INITIAL_STATE,
        values: {
            ...DEFAULT_VALUES,
            recipient: initialValues.recipient,
            addressBookName: initialValues.addressBookName ?? '',
            amountInputType: initialValues.amountInputType ?? 'crypto',
            isMax: initialValues.isMax ?? false
        },
        parsed: {
            ...INITIAL_STATE.parsed,
            isMax: initialValues.isMax ?? false
        },
        stepIndex: initialValues.stepIndex ?? 0,
        suggestion: hasValidSuggestion ? draftSuggestion : EMPTY_SUGGESTION
    };
}

export function sendFormReducer(state: SendFormState, action: SendFormAction): SendFormState {
    switch (action.type) {
        case 'SET_RECIPIENT':
            return applySetRecipient(state, action);

        case 'SET_ADDRESS_BOOK_NAME':
            return {
                ...state,
                values: { ...state.values, addressBookName: action.name }
            };

        case 'SET_AMOUNT':
            return {
                ...state,
                values: { ...state.values, amount: action.value, isMax: false },
                parsed: { ...state.parsed, isMax: false }
            };

        case 'SET_AMOUNT_VALIDATED':
            return {
                ...state,
                values: { ...state.values, amount: action.formatted },
                parsed: { ...state.parsed, amount: action.parsed },
                errors: { ...state.errors, amount: action.error }
            };

        case 'SET_AMOUNT_INPUT_TYPE':
            return {
                ...state,
                values: { ...state.values, amountInputType: action.value }
            };

        case 'SET_IS_MAX':
            return {
                ...state,
                values: { ...state.values, isMax: action.value },
                parsed: { ...state.parsed, isMax: action.value }
            };

        case 'SET_ASSET':
            return {
                ...state,
                values: { ...state.values, assetId: action.assetId },
                parsed: { ...state.parsed, asset: action.asset },
                errors: { ...state.errors, asset: action.error }
            };

        case 'NEXT_STEP':
            return state.stepIndex < LAST_STEP_INDEX
                ? { ...state, stepIndex: state.stepIndex + 1 }
                : state;

        case 'PREV_STEP':
            return state.stepIndex > 0 ? { ...state, stepIndex: state.stepIndex - 1 } : state;

        case 'RESET':
            return INITIAL_STATE;

        case 'VALIDATE_RECIPIENT_RESULT':
            return applyValidateRecipientResult(state, action);

        case 'SELECT_SUGGESTION':
            return applySelectSuggestion(state, action);

        case 'CLEAR_SUGGESTION':
            return applyClearSuggestion(state);

        case 'RESTORE_DRAFT':
            return applyRestoreDraft(state, action);

        default:
            return state;
    }
}
