import { useEffect, useMemo } from 'react';

import { BTC_ASSET, PortfolioType } from '@safely/core';

import { useAnalytics } from './useAnalytics';
import { useOnboardingId } from '../../shared/analytics/useOnboardingId';
import { useRate } from '../asset/useRate';
import { useBtcBalances } from '../btc-blockchain';
import { resolveBtcWallet, usePortfolios } from '../portfolio';
import { AccountLinkState, useAccountLinkState } from '../synced-device';

export function useTrackWalletOpen() {
    const analytics = useAnalytics();
    const portfolios = usePortfolios();
    const wallets = useMemo(
        () => portfolios.filter(p => p.type === PortfolioType.BIP39).map(p => resolveBtcWallet(p)),
        [portfolios]
    );

    const linkState = useAccountLinkState();
    const totalBtc = useBtcBalances(wallets);
    const getOnboardingId = useOnboardingId();
    const { data: btcRate } = useRate(BTC_ASSET);

    const fiatAmount = useMemo(() => {
        if (wallets.length === 0) return 0;
        if (!btcRate || !totalBtc) return null;

        return totalBtc.convert(btcRate).amount.toNumber();
    }, [totalBtc, btcRate, wallets.length]);

    useEffect(() => {
        if (fiatAmount === null) return;

        void (async () => {
            const onboardingId = await getOnboardingId();
            await analytics.trackWalletOpen({
                onboardingId,
                fiatAmount,
                sync: linkState === AccountLinkState.PROTECTED
            });
        })();
    }, [fiatAmount, analytics, linkState, getOnboardingId]);
}
