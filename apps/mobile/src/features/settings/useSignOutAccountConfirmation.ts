import { useNavigation } from '@react-navigation/native';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { useAccounts, useActiveAccount, useDeleteAccount, useToast } from '@safely/ux';

import { RootStackNavigationProp } from '@mobile/app/navigation/types';

export function useSignOutAccountConfirmation() {
    const { t } = useTranslation();
    const navigation = useNavigation<RootStackNavigationProp>();
    const accounts = useAccounts();
    const account = useActiveAccount();
    const toast = useToast();
    const { mutateAsync: deleteAccount } = useDeleteAccount();

    return useCallback(() => {
        const isLastAccount = accounts?.length === 1;

        navigation.navigate('SignOutAccountSheet', {
            accountName: account.meta.name,
            onConfirm: async () => {
                await deleteAccount();

                if (isLastAccount) {
                    navigation.reset({
                        index: 0,
                        routes: [{ name: 'WelcomeScreen' }]
                    });
                }

                toast(t('settings.signOutAccount.toastAccountRemoved'));
            },
            onProtect: () => {
                navigation.navigate('SettingsModal', { screen: 'ProtectAccountModal' });
            }
        });
    }, [navigation, account.meta.name, accounts?.length, deleteAccount, toast, t]);
}
