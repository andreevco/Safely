import { useNavigation } from '@react-navigation/native';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Alert, View } from 'react-native';

import { delay } from '@safely/core';
import { useActivePortfolio, useDeletePortfolio, useLogOutFromAllAccounts } from '@safely/ux';

import { RootStackNavigationProp, SettingsStackNavigationProp } from '@mobile/app/navigation/types';
import { Cell, List, Screen, Text } from '@mobile/shared/ui';

import { styles } from './SettingsScreen.styles';

interface SettingsItem {
    key: string;
    titleKey: string;
}

interface SettingsGroup {
    titleKey: string;
    items: SettingsItem[];
}

const groups: SettingsGroup[] = [
    {
        titleKey: 'settings.groups.account.title',
        items: [
            { key: 'notifications', titleKey: 'settings.groups.account.options.notifications' },
            { key: 'security', titleKey: 'settings.groups.account.options.security' },
            { key: 'language', titleKey: 'settings.groups.account.options.language' }
        ]
    },
    {
        titleKey: 'settings.groups.info.title',
        items: [
            { key: 'support', titleKey: 'settings.groups.info.options.support' },
            { key: 'faq', titleKey: 'settings.groups.info.options.faq' },
            { key: 'rate', titleKey: 'settings.groups.info.options.rate' },
            { key: 'legal', titleKey: 'settings.groups.info.options.legal' }
        ]
    }
];

export const SettingsScreen = () => {
    const { t } = useTranslation();
    const navigation = useNavigation<SettingsStackNavigationProp>();
    const rootNavigation = useNavigation<RootStackNavigationProp>();

    const handleItemPress = (key: string) => {
        if (key === 'language') {
            navigation.navigate('LanguageModal');
        }

        if (key === 'notifications') {
            navigation.navigate('NotificationsModal');
        }

        if (key === 'security') {
            navigation.navigate('SecurityModal');
        }
    };

    const { mutateAsync: logOutFromAllAccounts } = useLogOutFromAllAccounts();
    const { mutate: signOutAllAccounts } = useMutation({
        async mutationFn() {
            await logOutFromAllAccounts();
            rootNavigation.reset({
                index: 0,
                routes: [{ name: 'WelcomeScreen' }]
            });
        }
    });
    const handleSignOut = () => {
        Alert.alert(
            t('settings.signOutAllAccounts.confirm.title'),
            t('settings.signOutAllAccounts.confirm.message'),
            [
                { text: t('settings.signOutAllAccounts.confirm.cancel'), style: 'cancel' },
                {
                    text: t('settings.signOutAllAccounts.confirm.confirm'),
                    style: 'destructive',
                    onPress: () => signOutAllAccounts()
                }
            ]
        );
    };

    const activePortfolio = useActivePortfolio();
    const { mutateAsync: deletePortfolio } = useDeletePortfolio();
    const { mutate: signOutPortfolio } = useMutation({
        async mutationFn() {
            await deletePortfolio(activePortfolio);

            rootNavigation.reset({
                index: 0,
                routes: [{ name: 'TabsNavigator' }]
            });
        },
        onError: error => {
            console.error(error);
            rootNavigation.goBack();
        }
    });
    const handleDeletePortfolio = () => {
        Alert.alert(
            t('settings.removePortfolio.confirm.title'),
            t('settings.removePortfolio.confirm.message'),
            [
                { text: t('settings.removePortfolio.confirm.cancel'), style: 'cancel' },
                {
                    text: t('settings.removePortfolio.confirm.confirm'),
                    style: 'destructive',
                    onPress: () => signOutPortfolio()
                }
            ]
        );
    };

    return (
        <Screen>
            <Screen.Header variant="center">
                <View style={styles.headerPlaceholder} />
                <Screen.Header.Title>{t('settings.title')}</Screen.Header.Title>
                <Screen.Header.CloseButton />
            </Screen.Header>
            <Screen.Scrollable contentContainerStyle={styles.container}>
                {groups.map(group => (
                    <List key={group.titleKey}>
                        <List.Title>{t(group.titleKey)}</List.Title>
                        <List.Group variant="divided">
                            {group.items.map(item => (
                                <Cell key={item.key} onPress={() => handleItemPress(item.key)}>
                                    <Cell.Content>
                                        <Cell.Row>
                                            <Cell.Title>{t(item.titleKey)}</Cell.Title>
                                            {item.key === 'language' && (
                                                <Cell.Value variant="bodyL" color="tertiary">
                                                    {t('currentLanguageName')}
                                                </Cell.Value>
                                            )}
                                        </Cell.Row>
                                    </Cell.Content>
                                </Cell>
                            ))}
                        </List.Group>
                    </List>
                ))}
                <List>
                    <List.Group variant="divided" style={styles.signOutGroup}>
                        <Cell style={styles.signOutCell} onPress={handleDeletePortfolio}>
                            <Cell.Content>
                                <Cell.Row>
                                    <Text variant="labelL" style={styles.signOutText}>
                                        {t('settings.removePortfolio.title')}
                                    </Text>
                                </Cell.Row>
                            </Cell.Content>
                        </Cell>
                    </List.Group>
                    <List.Group>
                        <Cell style={styles.signOutCell} onPress={handleSignOut}>
                            <Cell.Content>
                                <Cell.Row>
                                    <Text variant="labelL" style={styles.signOutText}>
                                        {t('settings.signOutAllAccounts.title')}
                                    </Text>
                                </Cell.Row>
                            </Cell.Content>
                        </Cell>
                    </List.Group>
                </List>
            </Screen.Scrollable>
        </Screen>
    );
};
