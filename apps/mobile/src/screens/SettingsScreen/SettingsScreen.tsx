import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useHasPortfolio } from '@safely/ux';

import { List, Screen } from '@mobile/shared/ui';

import {
    CurrentWalletSection,
    RemovePortfolioButton,
    SettingsGroups,
    SignOutAccountButton
} from './components';
import { styles } from './SettingsScreen.styles';

export const SettingsScreen = () => {
    const { t } = useTranslation();
    const hasPortfolio = useHasPortfolio();

    return (
        <Screen>
            <Screen.Header variant="center">
                <View style={styles.headerPlaceholder} />
                <Screen.Header.Title>{t('settings.title')}</Screen.Header.Title>
                <Screen.Header.CloseButton />
            </Screen.Header>
            <Screen.Scrollable contentContainerStyle={styles.container}>
                {hasPortfolio && <CurrentWalletSection />}
                <SettingsGroups />
                <List>
                    {hasPortfolio && <RemovePortfolioButton />}
                    <SignOutAccountButton />
                </List>
            </Screen.Scrollable>
        </Screen>
    );
};
