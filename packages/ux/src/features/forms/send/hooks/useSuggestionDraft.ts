import { useCallback, useState } from 'react';

import { SendSuggestion } from '../types';

export interface SuggestionDraftState {
    selectedId?: string;
    suggestionIds?: string[];
}

export function useSuggestionDraft(initial?: SuggestionDraftState) {
    const [selectedId, setSelectedId] = useState<string | undefined>(initial?.selectedId);
    const [suggestionIds, setSuggestionIds] = useState<string[] | undefined>(
        initial?.suggestionIds
    );

    const select = useCallback((id: string, visibleSuggestions: SendSuggestion[]) => {
        setSelectedId(id);
        setSuggestionIds(visibleSuggestions.map(s => s.id));
    }, []);

    const clear = useCallback(() => {
        setSelectedId(undefined);
        setSuggestionIds(undefined);
    }, []);

    return {
        state: {
            selectedId,
            suggestionIds
        },
        actions: {
            selectedId,
            select,
            clear
        }
    };
}
