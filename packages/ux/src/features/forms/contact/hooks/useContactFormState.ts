import { useCallback, useReducer } from 'react';

import { contactFormReducer, createInitialState } from '../reducer';
import { ContactFormInitialValues, ContactFormResult } from '../types';
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

    const setAddress = useCallback((value: string) => {
        dispatch({ type: 'SET_ADDRESS', value });

        const result = validateContactAddress(value);
        dispatch({
            type: 'SET_ADDRESS_VALIDATED',
            parsed: result.parsed,
            blockchain: result.blockchain,
            error: result.error
        });
    }, []);

    const reset = useCallback(() => {
        dispatch({ type: 'RESET' });
    }, []);

    const buildResult = useCallback((): ContactFormResult | null => {
        if (!state.parsed.name || !state.parsed.address || !state.parsed.blockchain) {
            return null;
        }

        return {
            name: state.parsed.name,
            address: state.parsed.address,
            blockchain: state.parsed.blockchain
        };
    }, [state.parsed]);

    return {
        state,
        actions: {
            setName,
            setAddress,
            reset
        },
        buildResult
    };
}
