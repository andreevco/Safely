import { useNavigation } from '@react-navigation/native';

import { RootStackNavigationProp } from '@mobile/app/navigation/types';
import { Chart } from '@mobile/features/chart';
import { AssetsList, HomeActions, HomeHeader, TotalBalance } from '@mobile/features/home';
import { Screen } from '@mobile/shared/ui';

export const HomeScreen = () => {
    const navigation = useNavigation<RootStackNavigationProp<'TabsNavigator'>>();

    const handleNavigateToSelectAccount = () => {
        navigation.navigate('SelectAccountModal');
    };

    const handleSettingsPress = () => {
        navigation.navigate('SettingsModal');
    };

    const handleCurrencyPress = () => {
        navigation.navigate('CurrencyModal');
    };

    return (
        <Screen>
            <HomeHeader
                onCurrencyPress={handleCurrencyPress}
                onSettingsPress={handleSettingsPress}
                onSelectAccountPress={handleNavigateToSelectAccount}
            />
            <Screen.Scrollable>
                <TotalBalance />
                <HomeActions />
                <AssetsList />
                <Chart />
            </Screen.Scrollable>
        </Screen>
    );
};
