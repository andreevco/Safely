import { useMemo } from 'react';

import { RatedCryptoAssetAmount } from '@safely/core';

import {
    findPortfolioMetaByAddress,
    useActiveDerivation,
    usePortfolios
} from '../../../../entities';
import { fuzzySearch } from '../../../../shared';
import { SendFormState } from '../types';

interface UseSendFormMetaParams {
    state: SendFormState;
    assetsData: RatedCryptoAssetAmount[] | undefined;
}

export function useSendFormMeta(params: UseSendFormMetaParams) {
    const { state, assetsData } = params;

    const blockchain = state.parsed.recipient?.blockchain;
    const portfolios = usePortfolios();
    const activeDerivation = useActiveDerivation();

    const suggestions = useMemo(() => {
        const query = state.values.recipient;

        const allAddresses = fuzzySearch(portfolios, query, s => s.meta.name)
            .flatMap(portfolio => {
                const derivations = portfolio.getDerivations();
                return derivations
                    .filter(d => !d.id.isEq(activeDerivation.id))
                    .map(derivation => ({
                        address: derivation.chains.btc.wallets[0]?.address,
                        meta: portfolio.meta,
                        tag: derivations.length > 1 ? derivation.index + 1 : undefined
                    }));
            })
            .slice(0, 8);

        return allAddresses;
    }, [portfolios, activeDerivation, state.values.recipient, state.parsed.recipient]);

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
        portfolioMetaByAddress
    };
}
