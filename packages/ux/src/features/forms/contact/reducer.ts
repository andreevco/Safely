import {
    ContactFormAction,
    ContactFormInitialValues,
    ContactFormState,
    ContactFormValues
} from './types';
import { validateContactAddress, validateContactName } from './validators';

const DEFAULT_VALUES: ContactFormValues = {
    name: '',
    address: ''
};

export const INITIAL_STATE: ContactFormState = {
    values: DEFAULT_VALUES,
    parsed: {
        name: undefined,
        address: undefined,
        blockchain: undefined
    },
    errors: {
        name: undefined,
        address: undefined
    }
};

export function createInitialState(initialValues?: ContactFormInitialValues): ContactFormState {
    if (!initialValues) return INITIAL_STATE;

    const name = initialValues.name ?? '';
    const address = initialValues.address ?? '';

    const nameResult = name ? validateContactName(name) : { parsed: undefined, error: undefined };
    const addressResult = address
        ? validateContactAddress(address)
        : { parsed: undefined, blockchain: undefined, error: undefined };

    return {
        values: { ...DEFAULT_VALUES, name, address },
        parsed: {
            name: nameResult.parsed,
            address: addressResult.parsed,
            blockchain: addressResult.blockchain
        },
        errors: {
            name: nameResult.error,
            address: addressResult.error
        }
    };
}

export function contactFormReducer(
    state: ContactFormState,
    action: ContactFormAction
): ContactFormState {
    switch (action.type) {
        case 'SET_NAME':
            return {
                ...state,
                values: { ...state.values, name: action.value }
            };

        case 'SET_NAME_VALIDATED':
            return {
                ...state,
                parsed: { ...state.parsed, name: action.parsed },
                errors: { ...state.errors, name: action.error }
            };

        case 'SET_ADDRESS':
            return {
                ...state,
                values: { ...state.values, address: action.value }
            };

        case 'SET_ADDRESS_VALIDATED':
            return {
                ...state,
                parsed: {
                    ...state.parsed,
                    address: action.parsed,
                    blockchain: action.blockchain
                },
                errors: { ...state.errors, address: action.error }
            };

        case 'RESET':
            return INITIAL_STATE;

        default:
            return state;
    }
}
