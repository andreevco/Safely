import { useScrollToTop } from '@react-navigation/native';
import { useRef } from 'react';
import type { ScrollView } from 'react-native';

import { useHasPortfolio } from '@safely/ux';

import { Chart } from '@mobile/features/chart';
import { DeviceUnlinkedBanner } from '@mobile/features/device-link';
import { AssetsList, HomeActions, HomeHeader, TotalBalance } from '@mobile/features/home';
import { Banners } from '@mobile/features/notices';
import { Screen } from '@mobile/shared/ui';

import { HomeEmptyState } from './components';

export const HomeScreen = () => {
    const hasPortfolio = useHasPortfolio();
    const scrollRef = useRef<ScrollView>(null);

    useScrollToTop(scrollRef);

    return (
        <Screen>
            <HomeHeader />
            {hasPortfolio ? (
                <Screen.Scrollable ref={scrollRef}>
                    <DeviceUnlinkedBanner />
                    <Banners />
                    <TotalBalance />
                    <HomeActions />
                    <AssetsList />
                    <Chart />
                </Screen.Scrollable>
            ) : (
                <HomeEmptyState />
            )}
        </Screen>
    );
};
