import { useScrollToTop } from '@react-navigation/native';
import { useRef } from 'react';
import type { ScrollView } from 'react-native';

import { useHasPortfolio, useIsActivePortfolioOverview, useTrackWalletOpen } from '@safely/ux';

import { Chart } from '@mobile/features/chart';
import { DeviceUnlinkedBanner } from '@mobile/features/device-link';
import { AssetsList, HomeActions, HomeHeader, TotalBalance } from '@mobile/features/home';
import { Banners } from '@mobile/features/notices';
import { LedgerPortfolioOverview } from '@mobile/features/portfolio/LedgerPortfolioOverview';
import { Screen } from '@mobile/shared/ui';

import { HomeEmptyState } from './components';

export const HomeScreen = () => {
    const hasPortfolio = useHasPortfolio();

    return (
        <Screen>
            <HomeHeader />
            {hasPortfolio ? <HomeContent /> : <HomeEmptyState />}
        </Screen>
    );
};

function HomeContent() {
    const scrollRef = useRef<ScrollView>(null);

    useScrollToTop(scrollRef);
    useTrackWalletOpen();

    const isOverview = useIsActivePortfolioOverview();

    return (
        <Screen.Scrollable ref={scrollRef}>
            <DeviceUnlinkedBanner />
            <Banners />
            {isOverview ? (
                <LedgerPortfolioOverview />
            ) : (
                <>
                    <TotalBalance />
                    <HomeActions />
                    <AssetsList />
                    <Chart />
                </>
            )}
        </Screen.Scrollable>
    );
}
