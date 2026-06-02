import { useNavigation } from '@react-navigation/core';

import { WalletSelector } from '@mobile/features/portfolio';
import { TEST_ID } from '@mobile/shared/constants';
import { Screen } from '@mobile/shared/ui';

import { CurrencyButton, SettingsButton } from './components';

export const HomeHeader = () => {
    const navigation = useNavigation();

    return (
        <Screen.Header>
            <Screen.Header.Button
                testID={TEST_ID.home.settingsButton}
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
