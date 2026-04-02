import { useCallback, useEffect, useRef } from 'react';

import { SendSuggestion } from '@safely/ux';

interface UseSuggestionSelectionParams {
    suggestions: SendSuggestion[];
    restoredSuggestions?: SendSuggestion[];
    selectedId?: string;
    onChangeText: (value: string, label?: string) => void;
    onSelectSuggestion: (id: string, visibleSuggestions: SendSuggestion[]) => void;
    onClearSuggestionSelection: () => void;
}

export function useSuggestionSelection(params: UseSuggestionSelectionParams) {
    const {
        suggestions,
        restoredSuggestions,
        selectedId,
        onChangeText,
        onSelectSuggestion,
        onClearSuggestionSelection
    } = params;

    const savedSuggestions = useRef<SendSuggestion[]>(restoredSuggestions ?? suggestions);

    useEffect(() => {
        if (suggestions.length > 0) {
            savedSuggestions.current = suggestions;
        }
    }, [suggestions]);

    const displaySuggestions = selectedId ? savedSuggestions.current : suggestions;

    const handleSelect = useCallback(
        (id: string, address: string, label: string) => {
            onSelectSuggestion(id, savedSuggestions.current);
            onChangeText(address, label);
        },
        [onChangeText, onSelectSuggestion]
    );

    const handleChangeText = useCallback(
        (text: string, label?: string) => {
            onClearSuggestionSelection();
            onChangeText(text, label);
        },
        [onChangeText, onClearSuggestionSelection]
    );

    return {
        displaySuggestions,
        selectedId,
        handleSelect,
        handleChangeText
    };
}
