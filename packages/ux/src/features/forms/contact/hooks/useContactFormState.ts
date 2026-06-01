import { useCallback, useReducer } from 'react';

import { contactFormReducer, createInitialState } from '../reducer';
import type {
    ContactFormInitialValues,
    ContactFormParsedAddress,
    ContactFormResult
} from '../types';
import { validateContactAddress, validateContactName } from '../validators';

export interface UseContactFormStateParams {
    initialValues?: ContactFormInitialValues;
}

export function useContactFormState(params: UseContactFormStateParams) {
    const { initialValues } = params;

    const [state, dispatch] = useReducer(contactFormReducer, initialValues, createInitialState);

    const setName = useCallback((value: string) => {
        dispatch({ type: 'SET_NAME', value });

        const result = validateContactName(value);
        dispatch({
            type: 'SET_NAME_VALIDATED',
            parsed: result.parsed,
            error: result.error
        });
    }, []);

    const setAddress = useCallback((index: number, value: string) => {
        dispatch({ type: 'SET_ADDRESS', index, value });

        const result = validateContactAddress(value);
        dispatch({
            type: 'SET_ADDRESS_VALIDATED',
            index,
            parsed: result.parsed,
            error: result.error
        });
    }, []);

    const addAddress = useCallback(() => {
        dispatch({ type: 'ADD_ADDRESS' });
    }, []);

    const removeAddress = useCallback((index: number) => {
        dispatch({ type: 'REMOVE_ADDRESS', index });
    }, []);

    const reset = useCallback(() => {
        dispatch({ type: 'RESET' });
    }, []);

    const buildResult = useCallback((): ContactFormResult | null => {
        if (!state.parsed.name) return null;
        if (state.parsed.addresses.length === 0) return null;

        const parsedAddresses: ContactFormParsedAddress[] = [];
        for (const parsed of state.parsed.addresses) {
            if (!parsed) return null;
            parsedAddresses.push(parsed);
        }

        return {
            name: state.parsed.name,
            addresses: parsedAddresses
        };
    }, [state.parsed]);

    return {
        state,
        actions: {
            setName,
            setAddress,
            addAddress,
            removeAddress,
            reset
        },
        buildResult
    };
}
