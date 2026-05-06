import { useMemo } from 'react';

import { useActivePortfolioEntities, useContacts, usePortfolios } from '../../../../entities';
import { ContactSuggestion, PortfolioSuggestion } from '../types';
import { mapContactToSuggestions, mapPortfolioToSuggestions } from '../utils';

export interface SendFormSuggestions {
    portfolioSuggestions: PortfolioSuggestion[];
    contactSuggestions: ContactSuggestion[];
}

export function useSendFormSuggestions(): SendFormSuggestions {
    const contacts = useContacts();
    const entities = useActivePortfolioEntities();
    const portfolios = usePortfolios();

    const activePortfolio = useMemo(
        () => ({
            portfolioId: entities.portfolio.id,
            derivation: entities.kind === 'bip39' ? entities.derivation : undefined
        }),
        [entities]
    );

    const portfolioSuggestions = useMemo(
        () => portfolios.flatMap(p => mapPortfolioToSuggestions(p, activePortfolio)),
        [portfolios, activePortfolio]
    );

    const contactSuggestions = useMemo(
        () => contacts.flatMap(c => mapContactToSuggestions(c)),
        [contacts]
    );

    return { portfolioSuggestions, contactSuggestions };
}
