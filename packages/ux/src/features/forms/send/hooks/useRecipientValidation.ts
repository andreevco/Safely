import { Dispatch, useCallback, useRef } from 'react';

import { RatedCryptoAssetAmount } from '@safely/core';

import { SendFormAction, SendSuggestion } from '../types';
import { validateRecipientInput } from '../validators';

interface UseRecipientValidationParams {
    dispatch: Dispatch<SendFormAction>;
    ratedAssets: RatedCryptoAssetAmount[];
    activeWalletAddress: string;
    allSuggestions: SendSuggestion[];
}

export function useRecipientValidation(params: UseRecipientValidationParams) {
    const { dispatch, ratedAssets, activeWalletAddress, allSuggestions } = params;

    const ratedAssetsRef = useRef(ratedAssets);
    ratedAssetsRef.current = ratedAssets;

    const activeWalletAddressRef = useRef(activeWalletAddress);
    activeWalletAddressRef.current = activeWalletAddress;

    const allSuggestionsRef = useRef(allSuggestions);
    allSuggestionsRef.current = allSuggestions;

    const validateRecipient = useCallback(
        (value: string) => {
            const result = validateRecipientInput(value, {
                ratedAssets: ratedAssetsRef.current,
                activeWalletAddress: activeWalletAddressRef.current,
                allSuggestions: allSuggestionsRef.current
            });
            dispatch({ type: 'VALIDATE_RECIPIENT_RESULT', ...result });
        },
        [dispatch]
    );

    const setRecipient = useCallback(
        (value: string) => {
            dispatch({ type: 'SET_RECIPIENT', value });
            validateRecipient(value);
        },
        [dispatch, validateRecipient]
    );

    const selectSuggestion = useCallback(
        (id: string, visible: SendSuggestion[]) => {
            const picked = visible.find(s => s.id === id);
            if (!picked) return;

            dispatch({
                type: 'SELECT_SUGGESTION',
                id,
                address: picked.address,
                label: picked.meta.name,
                suggestionIds: visible.map(s => s.id)
            });
            validateRecipient(picked.address);
        },
        [dispatch, validateRecipient]
    );

    const clearSuggestion = useCallback(() => {
        dispatch({ type: 'CLEAR_SUGGESTION' });
    }, [dispatch]);

    return { setRecipient, selectSuggestion, clearSuggestion };
}
