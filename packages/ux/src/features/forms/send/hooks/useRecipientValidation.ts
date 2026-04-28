import { Dispatch, useCallback, useRef } from 'react';

import { RatedCryptoAssetAmount } from '@safely/core';

import { ContactSuggestion, PortfolioSuggestion, SendFormAction, SendSuggestions } from '../types';
import { validateRecipientInput } from '../validators';

interface UseRecipientValidationParams {
    dispatch: Dispatch<SendFormAction>;
    ratedAssets: RatedCryptoAssetAmount[];
    activeWalletAddress: string;
    portfolioSuggestions: PortfolioSuggestion[];
    contactSuggestions: ContactSuggestion[];
}

export function useRecipientValidation(params: UseRecipientValidationParams) {
    const { dispatch, ratedAssets, activeWalletAddress, portfolioSuggestions, contactSuggestions } =
        params;

    const ratedAssetsRef = useRef(ratedAssets);
    ratedAssetsRef.current = ratedAssets;

    const activeWalletAddressRef = useRef(activeWalletAddress);
    activeWalletAddressRef.current = activeWalletAddress;

    const portfolioSuggestionsRef = useRef(portfolioSuggestions);
    portfolioSuggestionsRef.current = portfolioSuggestions;

    const contactSuggestionsRef = useRef(contactSuggestions);
    contactSuggestionsRef.current = contactSuggestions;

    const validateRecipient = useCallback(
        (value: string) => {
            const result = validateRecipientInput(value, {
                ratedAssets: ratedAssetsRef.current,
                activeWalletAddress: activeWalletAddressRef.current,
                portfolioSuggestions: portfolioSuggestionsRef.current,
                contactSuggestions: contactSuggestionsRef.current
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
        (id: string, visible: SendSuggestions) => {
            const all = [...visible.portfolios, ...visible.contacts];
            const picked = all.find(s => s.id === id);
            if (!picked) return;

            dispatch({
                type: 'SELECT_SUGGESTION',
                id,
                address: picked.address,
                label: picked.meta.name,
                portfoliosIds: visible.portfolios.map(s => s.id),
                contactsIds: visible.contacts.map(s => s.id)
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
