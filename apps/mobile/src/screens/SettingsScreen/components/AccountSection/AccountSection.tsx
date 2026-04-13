import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Alert, View } from 'react-native';

import { useAccounts, useActiveAccount, useChangeAccountMeta } from '@safely/ux';

import { RootStackNavigationProp, SettingsStackNavigationProp } from '@mobile/app/navigation/types';
import { Button, Cell, List } from '@mobile/shared/ui';

import { SyncDot } from '../SyncDot';
import { styles } from './AccountSection.styles';
import { AccountSelector } from './AccountSelector';

export const AccountSection = () => {
    const { t } = useTranslation();
    const accounts = useAccounts();
    const account = useActiveAccount();
    const navigation = useNavigation<SettingsStackNavigationProp>();
    const rootNavigation = useNavigation<RootStackNavigationProp>();
    const { mutateAsync: changeAccountMeta } = useChangeAccountMeta();

    const handleEditAccount = () => {
        rootNavigation.navigate('CustomizeAccountModal', {
            defaultName: account.meta.name,
            onSave: async (name: string) => {
                await changeAccountMeta({ name });
                rootNavigation.pop();
            },
            onClose: () => {
                rootNavigation.pop();
            }
        });
    };

    const handleAddAccount = () => {
        rootNavigation.navigate('AddAccountSheet');
    };

    return (
        <List>
            <List.Title>{t('settings.groups.account.title')}</List.Title>
            <AccountSelector
                accounts={accounts ?? []}
                rootNavigation={rootNavigation}
                onAddAccount={handleAddAccount}
            />
            <List.Group variant="divided" style={styles.accountOptions}>
                <Cell onPress={handleEditAccount}>
                    <Cell.Content>
                        <Cell.Row>
                            <Cell.Title>
                                {t('settings.groups.account.options.editAccount')}
                            </Cell.Title>
                        </Cell.Row>
                    </Cell.Content>
                    <Cell.Chevron />
                </Cell>
                <Cell onPress={() => Alert.alert('Not implemented yet')}>
                    <Cell.Content>
                        <Cell.Row>
                            <Cell.Title>
                                {t('settings.groups.account.options.addressBook')}
                            </Cell.Title>
                        </Cell.Row>
                    </Cell.Content>
                    <Cell.Chevron />
                </Cell>
                <Cell onPress={() => navigation.navigate('NotificationsModal')}>
                    <Cell.Content>
                        <Cell.Row>
                            <Cell.Title>
                                {t('settings.groups.account.options.notifications')}
                            </Cell.Title>
                        </Cell.Row>
                    </Cell.Content>
                    <Cell.Chevron />
                </Cell>
                <Cell onPress={() => navigation.navigate('LanguageModal')}>
                    <Cell.Content>
                        <Cell.Row>
                            <Cell.Title>{t('settings.groups.account.options.language')}</Cell.Title>
                            <Cell.Value variant="bodyL" color="tertiary">
                                {t('currentLanguageName')}
                            </Cell.Value>
                        </Cell.Row>
                    </Cell.Content>
                </Cell>
                <Cell onPress={() => navigation.navigate('SecurityModal')}>
                    <Cell.Content>
                        <Cell.Row>
                            <Cell.Title>{t('settings.groups.account.options.security')}</Cell.Title>
                        </Cell.Row>
                    </Cell.Content>
                    <SyncDot />
                </Cell>
            </List.Group>
            <View style={styles.buttonContainer}>
                <Button type="secondary" size="small" onPress={handleAddAccount}>
                    {t('settings.addAccount')}
                </Button>
            </View>
        </List>
    );
};
