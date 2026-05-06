import { useMemo } from 'react';

import type { Contact, IDerivation, Portfolio, RatedCryptoAssetAmount } from '@safely/core';
import { PortfolioType } from '@safely/core';

import type { SuggestionDraftState } from './useSuggestionDraft';
import {
    findContactMetaByAddress,
    findPortfolioMetaByAddress,
    useActivePortfolioEntities,
    useContacts,
    usePortfolios
} from '../../../../entities';
import { fuzzySearch } from '../../../../shared';
import type { ContactSuggestion, PortfolioSuggestion, SendFormState } from '../types';

function mapContactToSuggestions(contact: Contact): ContactSuggestion[] {
    return contact.addresses.map(address => ({
        id: contact.id.toString(),
        address: address.address,
        meta: contact.meta
    }));
}

function mapPortfolioToSuggestions(
    portfolio: Portfolio,
    activeDerivation?: IDerivation
): PortfolioSuggestion[] {
    if (portfolio.type === PortfolioType.WATCH_ONLY) {
        return [
            {
                id: portfolio.id.toString(),
                address: portfolio.wallet.address,
                meta: portfolio.meta,
                isWatchOnly: true
            }
        ];
    }

    const derivations = portfolio.getDerivations();
    return derivations
        .filter(d => !activeDerivation || !d.id.isEq(activeDerivation.id))
        .map(derivation => ({
            id: portfolio.id.toString(),
            address: derivation.chains.btc.wallets[0]?.address,
            meta: portfolio.meta,
            tag: derivations.length > 1 ? derivation.index + 1 : undefined
        }));
}

interface UseSendFormMetaParams {
    state: SendFormState;
    assetsData: RatedCryptoAssetAmount[] | undefined;
    suggestionDraft: SuggestionDraftState;
}

export function useSendFormMeta(params: UseSendFormMetaParams) {
    const { state, assetsData, suggestionDraft } = params;
    const { selectedId, suggestionPortfoliosIds, suggestionContactsIds } = suggestionDraft;

    const blockchain = state.parsed.recipient?.blockchain;
    const portfolios = usePortfolios();
    const entities = useActivePortfolioEntities();
    const activeDerivation = entities.kind === 'bip39' ? entities.derivation : undefined;

    const contacts = useContacts();

    const suggestions = useMemo(() => {
        const query = state.values.recipient;

        return {
            portfolios: fuzzySearch(portfolios, query, s => s.meta.name).flatMap(portfolio =>
                mapPortfolioToSuggestions(portfolio, activeDerivation)
            ),
            contacts: fuzzySearch(contacts, query, s => s.meta.name).flatMap(contact =>
                mapContactToSuggestions(contact)
            )
        };
    }, [portfolios, activeDerivation, state.values.recipient, state.parsed.recipient]);

    const restoredSuggestions = useMemo(() => {
        if (!suggestionPortfoliosIds || !suggestionContactsIds || !selectedId) return undefined;

        const portfolioIdSet = new Set(suggestionPortfoliosIds);
        const contactIdSet = new Set(suggestionContactsIds);

        return {
            portfolios: portfolios
                .flatMap(portfolio => mapPortfolioToSuggestions(portfolio, activeDerivation))
                .filter(s => portfolioIdSet.has(s.id))
                .sort(
                    (a, b) =>
                        suggestionPortfoliosIds.indexOf(a.id) -
                        suggestionPortfoliosIds.indexOf(b.id)
                ),
            contacts: contacts
                .flatMap(contact => mapContactToSuggestions(contact))
                .filter(s => contactIdSet.has(s.id))
                .sort(
                    (a, b) =>
                        suggestionContactsIds.indexOf(a.id) - suggestionContactsIds.indexOf(b.id)
                )
        };
    }, [suggestionPortfoliosIds, suggestionContactsIds, selectedId, portfolios, activeDerivation]);

    const portfolioMetaByAddress = useMemo(() => {
        if (!state.parsed.recipient) {
            return;
        }

        return findPortfolioMetaByAddress(portfolios, state.parsed.recipient.address);
    }, [portfolios, state.parsed.recipient]);

    const contactMetaByAddress = useMemo(() => {
        if (!state.parsed.recipient) {
            return;
        }

        return findContactMetaByAddress(contacts, state.parsed.recipient.blockchain);
    }, [contacts, state.parsed.recipient]);

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
        portfolioMetaByAddress,
        contactMetaByAddress
    };
}
