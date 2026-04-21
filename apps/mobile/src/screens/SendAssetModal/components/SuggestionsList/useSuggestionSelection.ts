import { useCallback } from 'react';

import { SendSuggestion } from '@safely/ux';

interface UseSuggestionSelectionParams {
    suggestions: SendSuggestion[];
    allSuggestions: SendSuggestion[];
    restoredSuggestions?: SendSuggestion[];
    selectedId?: string;
    onChangeText: (value: string, label?: string) => void;
    onSelectSuggestion: (id: string, visibleSuggestions: SendSuggestion[]) => void;
    onClearSuggestionSelection: () => void;
}

export function useSuggestionSelection(params: UseSuggestionSelectionParams) {
    const {
        suggestions,
        allSuggestions,
        restoredSuggestions,
        selectedId,
        onChangeText,
        onSelectSuggestion,
        onClearSuggestionSelection
    } = params;

    const displaySuggestions =
        selectedId && restoredSuggestions ? restoredSuggestions : suggestions;

    const handleSelect = useCallback(
        (id: string) => {
            onSelectSuggestion(id, displaySuggestions);
        },
        [onSelectSuggestion, displaySuggestions]
    );

    const handleChangeText = useCallback(
        (text: string, label?: string) => {
            const trimmed = text.trim();
            const match = trimmed ? allSuggestions.find(s => s.address === trimmed) : undefined;

            if (match) {
                onSelectSuggestion(match.id, allSuggestions);
                return;
            }

            onClearSuggestionSelection();
            onChangeText(text, label);
        },
        [allSuggestions, onChangeText, onSelectSuggestion, onClearSuggestionSelection]
    );

    return {
        displaySuggestions,
        selectedId,
        handleSelect,
        handleChangeText
    };
}
