import { useNavigation } from '@react-navigation/native';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Alert, View } from 'react-native';

import {
    useActiveAccount,
    useActivePortfolio,
    useDeletePortfolio,
    usePortfolios,
    useSignOutFromAccount
} from '@safely/ux';

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
    const accountName = useActiveAccount()!.name;
    const portfolio = useActivePortfolio();
    const portfolios = usePortfolios();

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

    const { mutateAsync: _signOutAccount } = useSignOutFromAccount();
    const { mutate: signOutAccount } = useMutation({
        async mutationFn() {
            await _signOutAccount();
            rootNavigation.reset({
                index: 0,
                routes: [{ name: 'WelcomeScreen' }]
            });
        }
    });
    const handleSignOut = () => {
        Alert.alert(
            t('settings.signOutAccount.confirm.title', { name: accountName }),
            t('settings.signOutAccount.confirm.message', { name: accountName }),
            [
                { text: t('settings.signOutAccount.confirm.cancel'), style: 'cancel' },
                {
                    text: t('settings.signOutAccount.confirm.confirm'),
                    style: 'destructive',
                    onPress: () => signOutAccount()
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
        }
    });
    const handleDeletePortfolio = () => {
        Alert.alert(
            t('settings.removePortfolio.confirm.title', { name: portfolio.meta.name }),
            t('settings.removePortfolio.confirm.message', { name: portfolio.meta.name }),
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
                    {portfolios.length > 1 && (
                        <List.Group variant="divided" style={styles.signOutGroup}>
                            <Cell style={styles.signOutCell} onPress={handleDeletePortfolio}>
                                <Cell.Content>
                                    <Cell.Row>
                                        <Text variant="labelL" style={styles.signOutText}>
                                            {t('settings.removePortfolio.title', {
                                                name: portfolio.meta.name
                                            })}
                                        </Text>
                                    </Cell.Row>
                                </Cell.Content>
                            </Cell>
                        </List.Group>
                    )}
                    <List.Group>
                        <Cell style={styles.signOutCell} onPress={handleSignOut}>
                            <Cell.Content>
                                <Cell.Row>
                                    <Text variant="labelL" style={styles.signOutText}>
                                        {t('settings.signOutAccount.title', { name: accountName })}
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
