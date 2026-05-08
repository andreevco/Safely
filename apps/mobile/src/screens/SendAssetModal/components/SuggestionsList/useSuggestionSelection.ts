import { useCallback } from 'react';

import { SendSuggestions } from '@safely/ux';

interface UseSuggestionSelectionParams {
    suggestions: SendSuggestions;
    restoredSuggestions?: SendSuggestions;
    selectedId?: string;
    onChangeText: (value: string, label?: string) => void;
    onSelectSuggestion: (id: string, visibleSuggestions: SendSuggestions) => void;
}

export function useSuggestionSelection(params: UseSuggestionSelectionParams) {
    const { suggestions, restoredSuggestions, selectedId, onChangeText, onSelectSuggestion } =
        params;

    const displaySuggestions =
        selectedId && restoredSuggestions ? restoredSuggestions : suggestions;

    const handleSelect = useCallback(
        (id: string) => {
            onSelectSuggestion(id, displaySuggestions);
        },
        [onSelectSuggestion, displaySuggestions]
    );

    return {
        displaySuggestions,
        selectedId,
        handleSelect,
        handleChangeText: onChangeText
    };
}
