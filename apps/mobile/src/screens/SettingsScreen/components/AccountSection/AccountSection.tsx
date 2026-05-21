import { useNavigation } from '@react-navigation/native';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import {
    useAccounts,
    useActiveAccountMeta,
    useAppContext,
    useChangeAccountMeta,
    useConnectAccountToNewDevice
} from '@safely/ux';

import type {
    RootStackNavigationProp,
    SettingsStackNavigationProp
} from '@mobile/app/navigation/types';
import { Button, Cell, List } from '@mobile/shared/ui';

import { SyncDot } from '../SyncDot';
import { styles } from './AccountSection.styles';
import { AccountSelector } from './AccountSelector';

export const AccountSection = () => {
    const { t } = useTranslation();
    const accounts = useAccounts();
    const activeAccountName = useActiveAccountMeta().name;
    const navigation = useNavigation<SettingsStackNavigationProp>();
    const rootNavigation = useNavigation<RootStackNavigationProp>();
    const { mutateAsync: changeAccountMeta } = useChangeAccountMeta();

    const {
        storage: {
            sync: { getSecureEncrypted }
        }
    } = useAppContext();
    const { mutateAsync: connectAccountToNewDevice } = useConnectAccountToNewDevice();

    const handleEditAccount = () => {
        rootNavigation.navigate('CustomizeAccountModal', {
            defaultName: activeAccountName,
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

    const handleAddDevice = useCallback(async () => {
        using secureEncryptedStorage = getSecureEncrypted();
        secureEncryptedStorage.UNSAFE_SKIP_SECURITY_CHECK_unlock();

        await connectAccountToNewDevice({ secureEncryptedStorage });
    }, [connectAccountToNewDevice, getSecureEncrypted]);

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
                <Cell onPress={() => navigation.navigate('AddressBookModal')}>
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
            <View style={styles.buttonsContainer}>
                <Button type="secondary" size="small" onPress={handleAddDevice}>
                    {t('settings.linkDevice')}
                </Button>
                <Button type="secondary" size="small" onPress={handleAddAccount}>
                    {t('settings.addAccount')}
                </Button>
            </View>
        </List>
    );
};
