import { RootStackNavigationProp } from '@mobile/app/navigation/types';
import { AssetsList, HomeActions, HomeHeader, TotalBalance } from '@mobile/features/home';
import { Screen } from '@mobile/shared/ui';
import { useNavigation } from '@react-navigation/native';

export const HomeScreen = () => {
    const navigation = useNavigation<RootStackNavigationProp<'TabsNavigator'>>();

    const handleNavigateToSelectAccount = () => {
        navigation.navigate('SelectAccountModal');
    };

    return (
        <Screen>
            <HomeHeader onNavigateToSelectAccount={handleNavigateToSelectAccount} />
            <Screen.Scrollable>
                <TotalBalance />
                <HomeActions />
                <AssetsList />
            </Screen.Scrollable>
        </Screen>
    );
};
