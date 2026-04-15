import { useNavigation } from '@react-navigation/native';

import { RootStackNavigationProp } from '@mobile/app/navigation/types';
import { WalletSelector } from '@mobile/features/portfolio';
import { Screen } from '@mobile/shared/ui';

import { CurrencyButton, SettingsButton } from './components';

export const HomeHeader = () => {
    const navigation = useNavigation<RootStackNavigationProp<'TabsNavigator'>>();

    return (
        <Screen.Header>
            <Screen.Header.Button
                type="transparent"
                onPress={() => navigation.navigate('SettingsModal')}
            >
                <SettingsButton />
            </Screen.Header.Button>
            <Screen.Header.Title>
                <WalletSelector />
            </Screen.Header.Title>
            <Screen.Header.Button
                type="transparent"
                onPress={() => navigation.navigate('CurrencyModal')}
            >
                <CurrencyButton />
            </Screen.Header.Button>
        </Screen.Header>
    );
};
