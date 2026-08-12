import { useEffect, useMemo } from 'react';

import { BTC_ASSET, PortfolioType } from '@safely/core';

import { useAnalytics } from './useAnalytics';
import { useOnboardingId } from '../../shared/analytics/useOnboardingId';
import { useActivePortfolioRate } from '../asset/useRate';
import { sumBtcDisplay, useBtcWalletBalances } from '../btc-blockchain';
import { useActiveFiat } from '../fiat/useActiveFiat';
import { resolveBtcWallet, usePortfolios } from '../portfolio';
import { AccountLinkState, useAccountLinkState } from '../synced-device';

export function useTrackWalletOpen() {
    const fiat = useActiveFiat();
    const analytics = useAnalytics();
    const portfolios = usePortfolios();
    const wallets = useMemo(
        () =>
            portfolios
                .filter(p => p.type === PortfolioType.BIP39 || p.type === PortfolioType.LEDGER)
                .map(p => resolveBtcWallet(p)),
        [portfolios]
    );

    const linkState = useAccountLinkState();
    const totalBtc = sumBtcDisplay(useBtcWalletBalances(wallets));
    const { value: onboardingId } = useOnboardingId();
    const { data: btcRate } = useActivePortfolioRate(BTC_ASSET);

    const fiatAmount = useMemo(() => {
        if (wallets.length === 0) return 0;
        if (!btcRate || !totalBtc) return null;

        return totalBtc.convert(btcRate).amount.toNumber();
    }, [totalBtc, btcRate, wallets.length]);

    useEffect(() => {
        if (fiatAmount === null) return;

        void analytics.trackWalletOpen({
            onboardingId,
            fiatAmount,
            fiatSymbol: fiat.id.symbol,
            sync: linkState === AccountLinkState.PROTECTED
        });
    }, [fiatAmount, fiat.id.symbol, analytics, linkState, onboardingId]);
}
