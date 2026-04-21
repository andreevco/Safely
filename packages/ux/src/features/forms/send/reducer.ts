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
    recipientLabel: undefined,
    amount: '',
    amountInputType: 'crypto',
    isMax: false,
    assetId: ''
};

const EMPTY_SUGGESTION: SendSuggestionState = {
    selectedId: undefined,
    suggestionIds: undefined
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

    const hasValidSuggestion =
        !!draftSuggestion?.selectedId &&
        !!draftSuggestion.suggestionIds?.includes(draftSuggestion.selectedId);

    return {
        ...INITIAL_STATE,
        values: {
            ...DEFAULT_VALUES,
            recipient: initialValues.recipient,
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
        case 'SET_RECIPIENT': {
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

        case 'SET_RECIPIENT_VALIDATED':
            return {
                ...state,
                parsed: { ...state.parsed, recipient: action.recipient },
                errors: { ...state.errors, recipient: action.error }
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

        case 'RESET_DEPENDENT_FIELDS':
            return {
                ...state,
                values: { ...state.values, amount: '', assetId: '', isMax: false },
                parsed: {
                    ...state.parsed,
                    amount: undefined,
                    asset: undefined,
                    isMax: false
                },
                errors: { ...state.errors, amount: undefined, asset: undefined }
            };

        case 'SELECT_SUGGESTION':
            return applySelectSuggestion(state, action);

        case 'CLEAR_SUGGESTION':
            return { ...state, suggestion: EMPTY_SUGGESTION };

        case 'RESTORE_DRAFT':
            return applyRestoreDraft(state, action);

        default:
            return state;
    }
}

function applySelectSuggestion(
    state: SendFormState,
    action: Extract<SendFormAction, { type: 'SELECT_SUGGESTION' }>
): SendFormState {
    const recipientChanged = state.values.recipient !== action.address;
    const values = recipientChanged
        ? {
              ...state.values,
              recipient: action.address,
              recipientLabel: action.label,
              amount: '',
              assetId: '',
              isMax: false
          }
        : {
              ...state.values,
              recipientLabel: action.label ?? state.values.recipientLabel
          };

    return {
        ...state,
        values,
        parsed: recipientChanged
            ? { ...state.parsed, amount: undefined, asset: undefined, isMax: false }
            : state.parsed,
        errors: recipientChanged
            ? { ...state.errors, amount: undefined, asset: undefined }
            : state.errors,
        suggestion: {
            selectedId: action.id,
            suggestionIds: action.suggestionIds
        }
    };
}

function applyRestoreDraft(
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
