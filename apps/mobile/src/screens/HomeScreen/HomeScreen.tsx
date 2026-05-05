import { useScrollToTop } from '@react-navigation/native';
import { useRef } from 'react';
import { ScrollView } from 'react-native';

import { useHasPortfolio } from '@safely/ux';

import { Chart } from '@mobile/features/chart';
import {
    AssetsList,
    HomeActions,
    HomeBanners,
    HomeHeader,
    TotalBalance
} from '@mobile/features/home';
import { Screen } from '@mobile/shared/ui';

import { HomeEmptyState } from './components';

export const HomeScreen = () => {
    const hasPortfolio = useHasPortfolio();
    const scrollRef = useRef<ScrollView>(null);

    useScrollToTop(scrollRef);

    return (
        <Screen>
            <HomeHeader />
            <HomeBanners />
            {hasPortfolio ? (
                <Screen.Scrollable ref={scrollRef}>
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
