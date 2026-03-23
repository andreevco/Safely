import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { useAppContext, useHasPortfolio } from '@safely/ux';

import { useLogOutAllConfirmation } from '@mobile/features/settings/useLogOutAllConfirmation';
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
    const eraseAllData = useLogOutAllConfirmation();
    const tapCountRef = useRef(0);

    return (
        <Screen>
            <Screen.Header variant="center">
                <View style={styles.headerPlaceholder} />
                <Screen.Header.Title>
                    <Pressable
                        onPress={() => {
                            tapCountRef.current += 1;
                            if (tapCountRef.current >= 5) {
                                tapCountRef.current = 0;
                                eraseAllData();
                            }
                        }}
                    >
                        <Text textAlign="center" variant="titleS" numberOfLines={1}>
                            {t('settings.title')}
                        </Text>
                    </Pressable>
                </Screen.Header.Title>
                <Screen.Header.CloseButton />
            </Screen.Header>
            <Screen.Scrollable contentContainerStyle={styles.container}>
                {hasPortfolio && <CurrentWalletSection />}
                <AccountSection />
                <SettingsGroups />
                <List>
                    {hasPortfolio && <RemovePortfolioButton />}
                    <SignOutAccountButton />
                </List>
                <Text variant="bodyM" color="tertiary" textAlign="center" style={styles.version}>
                    Safely · {version}
                </Text>
            </Screen.Scrollable>
        </Screen>
    );
};
