import { useMemo } from 'react';

import { Portfolio, PortfolioType, RatedCryptoAssetAmount } from '@safely/core';

import {
    findPortfolioMetaByAddress,
    useActiveDerivation,
    usePortfolios
} from '../../../../entities';
import { fuzzySearch } from '../../../../shared';
import { SendFormState, SendSuggestion } from '../types';
import { SuggestionDraftState } from './useSuggestionDraft';

function mapPortfolioToSuggestions(
    portfolio: Portfolio,
    activeDerivation: ReturnType<typeof useActiveDerivation>
): SendSuggestion[] {
    const derivations = portfolio.getDerivations();
    return derivations
        .filter(d => !d.id.isEq(activeDerivation.id))
        .map(derivation => ({
            id: portfolio.id.toString(),
            address: derivation.chains.btc.wallets[0]?.address,
            meta: portfolio.meta,
            tag: derivations.length > 1 ? derivation.index + 1 : undefined,
            isWatchOnly: portfolio.id.type === PortfolioType.WATCH_ONLY
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
    const activeDerivation = useActiveDerivation();

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
