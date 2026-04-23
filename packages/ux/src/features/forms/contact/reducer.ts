import {
    ContactFormAction,
    ContactFormInitialValues,
    ContactFormState,
    ContactFormValues
} from './types';
import { validateContactAddress, validateContactName } from './validators';

const DEFAULT_VALUES: ContactFormValues = {
    name: '',
    addresses: [{ value: '' }]
};

export const INITIAL_STATE: ContactFormState = {
    values: DEFAULT_VALUES,
    parsed: {
        name: undefined,
        addresses: [undefined]
    },
    errors: {
        name: undefined,
        addresses: [undefined]
    }
};

export function createInitialState(initialValues?: ContactFormInitialValues): ContactFormState {
    if (!initialValues) return INITIAL_STATE;

    const name = initialValues.name ?? '';
    const rawAddresses =
        initialValues.addresses && initialValues.addresses.length > 0
            ? initialValues.addresses
            : [''];

    const nameResult = name ? validateContactName(name) : { parsed: undefined, error: undefined };
    const addressResults = rawAddresses.map(raw =>
        raw ? validateContactAddress(raw) : { parsed: undefined, error: undefined }
    );

    return {
        values: { name, addresses: rawAddresses.map(value => ({ value })) },
        parsed: {
            name: nameResult.parsed,
            addresses: addressResults.map(r => r.parsed)
        },
        errors: {
            name: nameResult.error,
            addresses: addressResults.map(r => r.error)
        }
    };
}

function replaceAt<T>(list: T[], index: number, value: T): T[] {
    const next = list.slice();
    next[index] = value;
    return next;
}

function removeAt<T>(list: T[], index: number): T[] {
    const next = list.slice();
    next.splice(index, 1);
    return next;
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
                values: {
                    ...state.values,
                    addresses: replaceAt(state.values.addresses, action.index, {
                        value: action.value
                    })
                }
            };

        case 'SET_ADDRESS_VALIDATED':
            return {
                ...state,
                parsed: {
                    ...state.parsed,
                    addresses: replaceAt(state.parsed.addresses, action.index, action.parsed)
                },
                errors: {
                    ...state.errors,
                    addresses: replaceAt(state.errors.addresses, action.index, action.error)
                }
            };

        case 'ADD_ADDRESS':
            return {
                ...state,
                values: {
                    ...state.values,
                    addresses: [...state.values.addresses, { value: '' }]
                },
                parsed: {
                    ...state.parsed,
                    addresses: [...state.parsed.addresses, undefined]
                },
                errors: {
                    ...state.errors,
                    addresses: [...state.errors.addresses, undefined]
                }
            };

        case 'REMOVE_ADDRESS':
            return {
                ...state,
                values: {
                    ...state.values,
                    addresses: removeAt(state.values.addresses, action.index)
                },
                parsed: {
                    ...state.parsed,
                    addresses: removeAt(state.parsed.addresses, action.index)
                },
                errors: {
                    ...state.errors,
                    addresses: removeAt(state.errors.addresses, action.index)
                }
            };

        case 'RESET':
            return INITIAL_STATE;

        default:
            return state;
    }
}
