import { useMemo } from 'react';

import { RatedCryptoAssetAmount } from '@safely/core';

import { useActivePortfolioEntities, useContacts, usePortfolios } from '../../../../entities';
import { fuzzySearch } from '../../../../shared';
import {
    ContactSuggestion,
    PortfolioSuggestion,
    RecipientMeta,
    SendFormState,
    SendSuggestions
} from '../types';
import { computeRecipientMeta, mapContactToSuggestions, mapPortfolioToSuggestions } from '../utils';

interface UseSendFormMetaParams {
    state: SendFormState;
    assetsData: RatedCryptoAssetAmount[] | undefined;
    portfolioSuggestions: PortfolioSuggestion[];
    contactSuggestions: ContactSuggestion[];
}

function filterAndOrderByIds<S extends { id: string }>(items: S[], ids: string[]): S[] {
    if (ids.length === 0) return [];
    const idSet = new Set(ids);
    return items.filter(s => idSet.has(s.id)).sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id));
}

export function useSendFormMeta(params: UseSendFormMetaParams) {
    const { state, assetsData, portfolioSuggestions, contactSuggestions } = params;
    const { selectedId, portfoliosIds, contactsIds } = state.suggestion;

    const blockchain = state.parsed.recipient?.blockchain;
    const portfolios = usePortfolios();
    const contacts = useContacts();
    const entities = useActivePortfolioEntities();
    const activeDerivation = entities.kind === 'bip39' ? entities.derivation : undefined;

    const suggestions = useMemo<SendSuggestions>(() => {
        const query = state.values.recipient;
        return {
            portfolios: fuzzySearch(portfolios, query, p => p.meta.name).flatMap(p =>
                mapPortfolioToSuggestions(p, activeDerivation)
            ),
            contacts: fuzzySearch(contacts, query, c => c.meta.name).flatMap(c =>
                mapContactToSuggestions(c)
            )
        };
    }, [portfolios, contacts, activeDerivation, state.values.recipient]);

    const restoredSuggestions = useMemo<SendSuggestions | undefined>(() => {
        if (!selectedId) return undefined;
        if (!portfoliosIds && !contactsIds) return undefined;

        return {
            portfolios: filterAndOrderByIds(portfolioSuggestions, portfoliosIds ?? []),
            contacts: filterAndOrderByIds(contactSuggestions, contactsIds ?? [])
        };
    }, [selectedId, portfoliosIds, contactsIds, portfolioSuggestions, contactSuggestions]);

    const recipientMeta = useMemo<RecipientMeta | undefined>(
        () => computeRecipientMeta(selectedId, portfolioSuggestions, contactSuggestions),
        [selectedId, portfolioSuggestions, contactSuggestions]
    );

    const isMaxAvailable = useMemo(() => {
        const asset = state.parsed.asset;
        return asset ? !asset.amount.relativeAmount.eq(0) : false;
    }, [state.parsed.asset]);

    const availableAssets = useMemo(() => {
        if (!blockchain || !assetsData) return [];
        return assetsData
            .map(ratedAsset => ratedAsset.amount)
            .filter(({ asset }) => asset.id.blockchain === blockchain);
    }, [assetsData, blockchain]);

    return {
        isMaxAvailable,
        availableAssets,
        suggestions,
        restoredSuggestions,
        recipientMeta
    };
}
