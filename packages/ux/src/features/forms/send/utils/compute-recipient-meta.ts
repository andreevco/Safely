import type { ContactSuggestion, PortfolioSuggestion, RecipientMeta } from '../types';

export function computeRecipientMeta(
    selectedId: string | undefined,
    portfolioSuggestions: PortfolioSuggestion[],
    contactSuggestions: ContactSuggestion[]
): RecipientMeta | undefined {
    if (!selectedId) return undefined;

    const portfolio = portfolioSuggestions.find(s => s.id === selectedId);
    if (portfolio) return { kind: 'portfolio', meta: portfolio.meta, tag: portfolio.tag };

    const contact = contactSuggestions.find(s => s.id === selectedId);
    if (contact) return { kind: 'contact', meta: contact.meta };

    return undefined;
}
