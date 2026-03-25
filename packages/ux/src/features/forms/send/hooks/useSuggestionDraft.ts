import { useCallback, useState } from 'react';

import { SendSuggestion } from '../types';

export interface SuggestionDraftState {
    selectedAddress?: string;
    suggestionAddresses?: string[];
}

export function useSuggestionDraft(initial?: SuggestionDraftState) {
    const [selectedAddress, setSelectedAddress] = useState<string | undefined>(
        initial?.selectedAddress
    );
    const [suggestionAddresses, setSuggestionAddresses] = useState<string[] | undefined>(
        initial?.suggestionAddresses
    );

    const select = useCallback((address: string, visibleSuggestions: SendSuggestion[]) => {
        setSelectedAddress(address);
        setSuggestionAddresses(visibleSuggestions.map(s => s.address));
    }, []);

    const clear = useCallback(() => {
        setSelectedAddress(undefined);
        setSuggestionAddresses(undefined);
    }, []);

    return {
        state: {
            selectedAddress,
            suggestionAddresses
        },
        actions: {
            selectedAddress,
            select,
            clear
        }
    };
}
