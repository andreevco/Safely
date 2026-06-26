import { useNavigation } from '@react-navigation/core';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import {
    AccountLinkState,
    useAccountLinkState,
    useAccounts,
    useActiveAccountMeta,
    useAppContext,
    useChangeAccountMeta,
    useConnectAccountToNewDevice
} from '@safely/ux';

import { Button, Cell, List } from '@mobile/shared/ui';

import { styles } from './AccountSection.styles';
import { AccountSelector } from './AccountSelector';

export const AccountSection = () => {
    const { t } = useTranslation();
    const accounts = useAccounts();
    const linkState = useAccountLinkState();
    const activeAccountName = useActiveAccountMeta().name;
    const navigation = useNavigation();
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    const nativeStackNavigation = useNavigation<NativeStackNavigationProp<{}>>();
    const { mutateAsync: changeAccountMeta } = useChangeAccountMeta();

    const {
        storage: {
            sync: { getSecureEncrypted }
        }
    } = useAppContext();
    const { mutateAsync: connectAccountToNewDevice } = useConnectAccountToNewDevice();

    const handleEditAccount = () => {
        navigation.navigate('CustomizeAccountModal', {
            defaultName: activeAccountName,
            onSave: async (name: string) => {
                await changeAccountMeta({ name });
                nativeStackNavigation.pop();
            },
            onClose: () => {
                nativeStackNavigation.pop();
            }
        });
    };

    const handleAddAccount = () => {
        navigation.navigate('AddAccountSheet');
    };

    const handleAddDevice = useCallback(async () => {
        using secureEncryptedStorage = getSecureEncrypted();
        await secureEncryptedStorage.unlock();

        await connectAccountToNewDevice({ secureEncryptedStorage });
    }, [connectAccountToNewDevice, getSecureEncrypted]);

    return (
        <List>
            <List.Title>{t('settings.groups.account.title')}</List.Title>
            <AccountSelector
                accounts={accounts ?? []}
                onSelectAccountNavigate={() => navigation.navigate('SelectAccountSelectorModal')}
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
                <Cell
                    onPress={() =>
                        navigation.navigate('SettingsModal', { screen: 'AddressBookModal' })
                    }
                >
                    <Cell.Content>
                        <Cell.Row>
                            <Cell.Title>
                                {t('settings.groups.account.options.addressBook')}
                            </Cell.Title>
                        </Cell.Row>
                    </Cell.Content>
                    <Cell.Chevron />
                </Cell>
                <Cell
                    onPress={() =>
                        navigation.navigate('SettingsModal', { screen: 'LanguageModal' })
                    }
                >
                    <Cell.Content>
                        <Cell.Row>
                            <Cell.Title>{t('settings.groups.account.options.language')}</Cell.Title>
                            <Cell.Value variant="bodyL" color="tertiary">
                                {t('currentLanguageName')}
                            </Cell.Value>
                        </Cell.Row>
                    </Cell.Content>
                </Cell>
                <Cell
                    onPress={() =>
                        navigation.navigate('SettingsModal', { screen: 'SecurityModal' })
                    }
                >
                    <Cell.Content>
                        <Cell.Row>
                            <Cell.Title>{t('settings.groups.account.options.security')}</Cell.Title>
                        </Cell.Row>
                    </Cell.Content>
                </Cell>
            </List.Group>
            <View style={styles.buttonsContainer}>
                {linkState !== AccountLinkState.UNLINKED && (
                    <Button type="secondary" size="small" onPress={handleAddDevice}>
                        {t('settings.linkDevice')}
                    </Button>
                )}
                <Button type="secondary" size="small" onPress={handleAddAccount}>
                    {t('settings.addAccount')}
                </Button>
            </View>
        </List>
    );
};
