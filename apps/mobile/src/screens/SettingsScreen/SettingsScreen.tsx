import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { usePortfolios } from '@safely/ux';

import { List, Screen } from '@mobile/shared/ui';

import { RemovePortfolioButton, SettingsGroups, SignOutAccountButton } from './components';
import { styles } from './SettingsScreen.styles';

export const SettingsScreen = () => {
    const { t } = useTranslation();
    const portfolios = usePortfolios();

    return (
        <Screen>
            <Screen.Header variant="center">
                <View style={styles.headerPlaceholder} />
                <Screen.Header.Title>{t('settings.title')}</Screen.Header.Title>
                <Screen.Header.CloseButton />
            </Screen.Header>
            <Screen.Scrollable contentContainerStyle={styles.container}>
                <SettingsGroups />
                <List>
                    {portfolios.length > 1 && <RemovePortfolioButton />}
                    <SignOutAccountButton />
                </List>
            </Screen.Scrollable>
        </Screen>
    );
};
