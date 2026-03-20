import { useNavigation } from '@react-navigation/native';
import { impactAsync, ImpactFeedbackStyle } from 'expo-haptics';
import { useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, View } from 'react-native';

import {
    useAccounts,
    useActiveAccount,
    useChangeAccountMeta,
    useSetActiveAccount
} from '@safely/ux';

import { RootStackNavigationProp, SettingsStackNavigationProp } from '@mobile/app/navigation/types';
import { Button, Cell, Checkmark28, Icon, List, PopupMenu, Switch16 } from '@mobile/shared/ui';
import { PopupMenuRef } from '@mobile/shared/ui/PopupMenu';

import { styles } from './AccountSection.styles';

const MAX_POPUP_ACCOUNTS = 5;

const AccountCell = (props: { name: string; walletsCount: number }) => {
    const { name, walletsCount } = props;
    const { t } = useTranslation();

    return (
        <Cell.Content>
            <Cell.Row>
                <Cell.Title>{name}</Cell.Title>
            </Cell.Row>
            <Cell.Row>
                <Cell.Subtitle>{t('settings.walletsCount', { count: walletsCount })}</Cell.Subtitle>
            </Cell.Row>
        </Cell.Content>
    );
};

export const AccountSection = () => {
    const { t } = useTranslation();
    const accounts = useAccounts();
    const account = useActiveAccount();
    const navigation = useNavigation<SettingsStackNavigationProp>();
    const rootNavigation = useNavigation<RootStackNavigationProp>();
    const { mutateAsync: setActiveAccount } = useSetActiveAccount();
    const { mutateAsync: changeAccountMeta } = useChangeAccountMeta();
    const popupMenuRef = useRef<PopupMenuRef>(null);

    const accountCount = accounts?.length ?? 0;
    const activeWalletsCount = account.syncProvider.get('portfolios')?.length ?? 0;

    const handleSwitchAccount = async (accountId: string) => {
        popupMenuRef.current?.close();
        if (accountId === account.accountId) return;
        impactAsync(ImpactFeedbackStyle.Medium);
        await setActiveAccount(accountId);
    };

    const handleOpenAccountSelector = () => {
        rootNavigation.navigate('SelectAccountSelectorModal');
    };

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
            {accountCount <= MAX_POPUP_ACCOUNTS ? (
                <PopupMenu
                    ref={popupMenuRef}
                    variant="fullWidth"
                    touchable={
                        <View pointerEvents="none">
                            <List.Group withoutBottomMargin>
                                <Cell>
                                    <AccountCell
                                        name={account.meta.name}
                                        walletsCount={activeWalletsCount}
                                    />
                                    <Icon icon={Switch16} color="tertiary" />
                                </Cell>
                            </List.Group>
                        </View>
                    }
                >
                    <List.Group variant="divided">
                        {accounts?.map(acc => {
                            const isActive = acc.accountId === account.accountId;
                            const walletsCount = acc.syncProvider.get('portfolios')?.length ?? 0;
                            return (
                                <Cell
                                    key={acc.accountId}
                                    onPress={() => handleSwitchAccount(acc.accountId)}
                                >
                                    <AccountCell name={acc.meta.name} walletsCount={walletsCount} />
                                    {isActive && <Icon icon={Checkmark28} color="accent" />}
                                </Cell>
                            );
                        })}
                    </List.Group>
                </PopupMenu>
            ) : (
                <List.Group withoutBottomMargin>
                    <Cell onPress={handleOpenAccountSelector}>
                        <AccountCell name={account.meta.name} walletsCount={activeWalletsCount} />
                        <Icon icon={Switch16} color="tertiary" />
                    </Cell>
                </List.Group>
            )}
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
                    <Cell.Chevron />
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
