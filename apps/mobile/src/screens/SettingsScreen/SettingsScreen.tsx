import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useAppContext, useHasPortfolio } from '@safely/ux';

import { List, Screen, Text } from '@mobile/shared/ui';

import {
    AccountSection,
    CurrentWalletSection,
    RemovePortfolioButton,
    SettingsGroups,
    SignOutAccountButton
} from './components';
import { styles } from './SettingsScreen.styles';

export const SettingsScreen = () => {
    const { t } = useTranslation();
    const { version } = useAppContext();
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
                <AccountSection />
                <SettingsGroups />
                <List
                    style={{
                        marginTop: 8
                    }}
                >
                    <List.Group variant="separated">
                        {hasPortfolio && <RemovePortfolioButton />}
                        <SignOutAccountButton />
                    </List.Group>
                </List>
                <Text variant="bodyM" color="tertiary" textAlign="center" style={styles.version}>
                    Safely · {version}
                </Text>
            </Screen.Scrollable>
        </Screen>
    );
};
