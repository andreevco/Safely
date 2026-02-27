import { Chart } from '@mobile/features/chart';
import { AssetsList, HomeActions, HomeHeader, TotalBalance } from '@mobile/features/home';
import { Screen } from '@mobile/shared/ui';

export const HomeScreen = () => {
    return (
        <Screen>
            <HomeHeader />
            <Screen.Scrollable>
                <TotalBalance />
                <HomeActions />
                <AssetsList />
                <Chart />
            </Screen.Scrollable>
        </Screen>
    );
};
