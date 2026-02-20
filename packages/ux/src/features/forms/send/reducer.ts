import {
    SendFormAction,
    SendFormInitialValues,
    SendFormState,
    SendFormValues,
    SEND_STEPS
} from './types';

const LAST_STEP_INDEX = SEND_STEPS.length - 1;

const DEFAULT_VALUES: SendFormValues = {
    recipient: '',
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
    isValidating: false,
    stepIndex: 0
};

export function createInitialState(initialValues?: SendFormInitialValues): SendFormState {
    if (!initialValues?.recipient) return INITIAL_STATE;

    return {
        ...INITIAL_STATE,
        values: {
            ...DEFAULT_VALUES,
            recipient: initialValues.recipient
        }
    };
}

export function sendFormReducer(state: SendFormState, action: SendFormAction): SendFormState {
    switch (action.type) {
        case 'SET_RECIPIENT':
            return {
                ...state,
                values: { ...state.values, recipient: action.value },
                isValidating: true
            };

        case 'SET_RECIPIENT_VALIDATED':
            return {
                ...state,
                parsed: { ...state.parsed, recipient: action.recipient },
                errors: { ...state.errors, recipient: action.error },
                isValidating: false
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

        case 'SET_VALIDATING':
            return { ...state, isValidating: action.isValidating };

        case 'NEXT_STEP':
            return state.stepIndex < LAST_STEP_INDEX
                ? { ...state, stepIndex: state.stepIndex + 1 }
                : state;

        case 'PREV_STEP':
            return state.stepIndex > 0
                ? { ...state, stepIndex: state.stepIndex - 1, errors: INITIAL_STATE.errors }
                : state;

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

        default:
            return state;
    }
}
