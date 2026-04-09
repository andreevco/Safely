import { useMemo } from 'react';

import { IDerivation, Portfolio, PortfolioType, RatedCryptoAssetAmount } from '@safely/core';

import {
    findPortfolioMetaByAddress,
    useActivePortfolioEntities,
    usePortfolios
} from '../../../../entities';
import { fuzzySearch } from '../../../../shared';
import { SendFormState, SendSuggestion } from '../types';
import { SuggestionDraftState } from './useSuggestionDraft';

function mapPortfolioToSuggestions(
    portfolio: Portfolio,
    activeDerivation?: IDerivation
): SendSuggestion[] {
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
    const { selectedId, suggestionIds: savedSuggestionIds } = suggestionDraft;

    const blockchain = state.parsed.recipient?.blockchain;
    const portfolios = usePortfolios();
    const entities = useActivePortfolioEntities();
    const activeDerivation = entities.kind === 'bip39' ? entities.derivation : undefined;

    const suggestions = useMemo(() => {
        const query = state.values.recipient;

        return fuzzySearch(portfolios, query, s => s.meta.name).flatMap(portfolio =>
            mapPortfolioToSuggestions(portfolio, activeDerivation)
        );
    }, [portfolios, activeDerivation, state.values.recipient, state.parsed.recipient]);

    const restoredSuggestions = useMemo(() => {
        if (!savedSuggestionIds || !selectedId) return undefined;

        const idSet = new Set(savedSuggestionIds);

        return portfolios
            .flatMap(portfolio => mapPortfolioToSuggestions(portfolio, activeDerivation))
            .filter(s => idSet.has(s.id))
            .sort((a, b) => savedSuggestionIds.indexOf(a.id) - savedSuggestionIds.indexOf(b.id));
    }, [savedSuggestionIds, selectedId, portfolios, activeDerivation]);

    const portfolioMetaByAddress = useMemo(() => {
        if (!state.parsed.recipient) {
            return;
        }

        return findPortfolioMetaByAddress(portfolios, state.parsed.recipient.address);
    }, [portfolios, state.parsed.recipient]);

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
        portfolioMetaByAddress
    };
}
