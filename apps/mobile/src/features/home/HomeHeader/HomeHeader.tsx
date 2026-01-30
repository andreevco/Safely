import { Screen } from '@mobile/shared/ui';

import { AccountSelector, CurrencyButton, SettingsButton } from './components';

type HomeHeaderProps = {
    onSelectAccountPress: () => void;
    onSettingsPress: () => void;
    onCurrencyPress: () => void;
};

export const HomeHeader = (props: HomeHeaderProps) => {
    const { onSelectAccountPress, onSettingsPress, onCurrencyPress } = props;

    return (
        <Screen.Header>
            <Screen.Header.Button onPress={onSettingsPress}>
                <SettingsButton />
            </Screen.Header.Button>
            <AccountSelector onSelectAccountPress={onSelectAccountPress} />
            <Screen.Header.Button onPress={onCurrencyPress}>
                <CurrencyButton />
            </Screen.Header.Button>
        </Screen.Header>
    );
};
