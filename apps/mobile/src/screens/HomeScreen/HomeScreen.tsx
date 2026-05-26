import { useScrollToTop } from '@react-navigation/native';
import { useRef } from 'react';
import { ScrollView } from 'react-native';

import { useHasPortfolio, useTrackWalletOpen } from '@safely/ux';

import { Chart } from '@mobile/features/chart';
import { DeviceUnlinkedBanner } from '@mobile/features/device-link';
import { AssetsList, HomeActions, HomeHeader, TotalBalance } from '@mobile/features/home';
import { Banners } from '@mobile/features/notices';
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

    return (
        <Screen.Scrollable ref={scrollRef}>
            <DeviceUnlinkedBanner />
            <Banners />
            <TotalBalance />
            <HomeActions />
            <AssetsList />
            <Chart />
        </Screen.Scrollable>
    );
}
