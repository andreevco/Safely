import { useNavigation } from '@react-navigation/native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Alert, View } from 'react-native';

import { RootStackNavigationProp, SettingsStackNavigationProp } from '@mobile/app/navigation/types';
import { usePasscode, useSecurityCheck } from '@mobile/entities/security';
import { clearAllAppData } from '@mobile/shared/storage/mmkv';
import { Cell, List, Screen, Text } from '@mobile/shared/ui';

import { styles } from './SettingsScreen.styles';
import { VersionButton } from './VersionButton';

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
    const queryClient = useQueryClient();
    const navigation = useNavigation<SettingsStackNavigationProp>();
    const rootNavigation = useNavigation<RootStackNavigationProp>();
    const check = useSecurityCheck();
    const passcode = usePasscode();

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

    const { mutate: signOut } = useMutation({
        async mutationFn() {
            await check();

            rootNavigation.reset({
                index: 0,
                routes: [{ name: 'WelcomeScreen' }]
            });
            await new Promise(resolve => setTimeout(resolve, 100));
            clearAllAppData();

            if (passcode.isSet) {
                await passcode.remove();
            }

            queryClient.clear();
        }
    });

    const handleSignOut = () => {
        Alert.alert(t('settings.signOut.confirm.title'), t('settings.signOut.confirm.message'), [
            { text: t('settings.signOut.confirm.cancel'), style: 'cancel' },
            {
                text: t('settings.signOut.confirm.confirm'),
                style: 'destructive',
                onPress: () => signOut()
            }
        ]);
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
                        <Cell style={styles.signOutCell} onPress={handleSignOut}>
                            <Cell.Content>
                                <Cell.Row>
                                    <Text variant="labelL" style={styles.signOutText}>
                                        {t('settings.signOut.title')}
                                    </Text>
                                </Cell.Row>
                            </Cell.Content>
                        </Cell>
                    </List.Group>
                </List>
                <VersionButton />
            </Screen.Scrollable>
        </Screen>
    );
};
