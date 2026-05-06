import { fuzzySearch } from '../../../../shared';
import { ContactSuggestion, PortfolioSuggestion, SendSuggestions } from '../types';

const getName = (s: PortfolioSuggestion | ContactSuggestion): string => s.meta.name;

export function filterSuggestionsByQuery(
    suggestions: SendSuggestions,
    query: string
): SendSuggestions {
    return {
        portfolios: fuzzySearch(suggestions.portfolios, query, getName),
        contacts: fuzzySearch(suggestions.contacts, query, getName)
    };
}
