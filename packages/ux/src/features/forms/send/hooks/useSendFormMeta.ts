import { useMemo } from 'react';

import { RatedCryptoAssetAmount } from '@safely/core';

import {
    findPortfolioMetaByAddress,
    useActivePortfolioEntities,
    usePortfolios
} from '../../../../entities';
import { fuzzySearch } from '../../../../shared';
import { SendFormState, SendSuggestion } from '../types';
import { mapPortfolioToSuggestions } from '../utils';

interface UseSendFormMetaParams {
    state: SendFormState;
    assetsData: RatedCryptoAssetAmount[] | undefined;
    allSuggestions: SendSuggestion[];
}

export function useSendFormMeta(params: UseSendFormMetaParams) {
    const { state, assetsData, allSuggestions } = params;
    const { selectedId, suggestionIds: savedSuggestionIds } = state.suggestion;

    const blockchain = state.parsed.recipient?.blockchain;
    const portfolios = usePortfolios();
    const entities = useActivePortfolioEntities();
    const activeDerivation = entities.kind === 'bip39' ? entities.derivation : undefined;

    const suggestions = useMemo(() => {
        const query = state.values.recipient;

        return fuzzySearch(portfolios, query, s => s.meta.name).flatMap(portfolio =>
            mapPortfolioToSuggestions(portfolio, activeDerivation)
        );
    }, [portfolios, activeDerivation, state.values.recipient]);

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
        allSuggestions,
        restoredSuggestions,
        portfolioMetaByAddress
    };
}
