import { useHasPortfolio } from '@safely/ux';

import { Chart } from '@mobile/features/chart';
import { AssetsList, HomeActions, HomeHeader, TotalBalance } from '@mobile/features/home';
import { Screen } from '@mobile/shared/ui';

import { HomeEmptyState } from './components';

export const HomeScreen = () => {
    const hasPortfolio = useHasPortfolio();

    return (
        <Screen>
            <HomeHeader />
            {hasPortfolio ? (
                <Screen.Scrollable>
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
