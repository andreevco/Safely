import { useNavigation } from '@react-navigation/native';

import { usePortfolios } from '@safely/ux';

import { RootStackNavigationProp } from '@mobile/app/navigation/types';
import { Screen } from '@mobile/shared/ui';

import {
    AccountSelector,
    CompactAccountSelector,
    CurrencyButton,
    SettingsButton
} from './components';

export const HomeHeader = () => {
    const navigation = useNavigation<RootStackNavigationProp<'TabsNavigator'>>();
    const portfolios = usePortfolios();

    return (
        <Screen.Header>
            <Screen.Header.Button
                type="transparent"
                onPress={() => navigation.navigate('SettingsModal')}
            >
                <SettingsButton />
            </Screen.Header.Button>
            {portfolios.length <= 10 ? <CompactAccountSelector /> : <AccountSelector />}
            <Screen.Header.Button
                type="transparent"
                onPress={() => navigation.navigate('CurrencyModal')}
            >
                <CurrencyButton />
            </Screen.Header.Button>
        </Screen.Header>
    );
};
