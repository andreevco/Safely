import { useCallback, useState } from 'react';

import type { SendSuggestions } from '../types';

export interface SuggestionDraftState {
    selectedId?: string;
    suggestionPortfoliosIds?: string[];
    suggestionContactsIds?: string[];
}

export function useSuggestionDraft(initial?: SuggestionDraftState) {
    const [selectedId, setSelectedId] = useState<string | undefined>(initial?.selectedId);
    const [suggestionPortfoliosIds, setSuggestionPortfoliosIds] = useState<string[] | undefined>(
        initial?.suggestionPortfoliosIds
    );
    const [suggestionContactsIds, setSuggestionContactsIds] = useState<string[] | undefined>(
        initial?.suggestionContactsIds
    );

    const select = useCallback((id: string, visibleSuggestions: SendSuggestions) => {
        setSelectedId(id);
        setSuggestionPortfoliosIds(visibleSuggestions.portfolios.map(s => s.id));
        setSuggestionContactsIds(visibleSuggestions.contacts.map(s => s.id));
    }, []);

    const clear = useCallback(() => {
        setSelectedId(undefined);
        setSuggestionPortfoliosIds(undefined);
        setSuggestionContactsIds(undefined);
    }, []);

    return {
        state: {
            selectedId,
            suggestionPortfoliosIds,
            suggestionContactsIds
        },
        actions: {
            selectedId,
            select,
            clear
        }
    };
}
