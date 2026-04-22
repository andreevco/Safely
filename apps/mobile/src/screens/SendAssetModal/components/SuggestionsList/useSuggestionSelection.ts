import { useCallback } from 'react';

import { SendSuggestion } from '@safely/ux';

interface UseSuggestionSelectionParams {
    suggestions: SendSuggestion[];
    restoredSuggestions?: SendSuggestion[];
    selectedId?: string;
    onChangeText: (value: string, label?: string) => void;
    onSelectSuggestion: (id: string, visibleSuggestions: SendSuggestion[]) => void;
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
