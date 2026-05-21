import { useNavigation } from '@react-navigation/native';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { useAccounts, useActiveAccountMeta, useDeleteAccount, useToast } from '@safely/ux';

import type { RootStackNavigationProp } from '@mobile/app/navigation/types';

export function useSignOutAccountConfirmation() {
    const { t } = useTranslation();
    const navigation = useNavigation<RootStackNavigationProp>();
    const accounts = useAccounts();
    const accountName = useActiveAccountMeta().name;
    const toast = useToast();
    const { mutateAsync: deleteAccount } = useDeleteAccount();

    return useCallback(() => {
        const isLastAccount = accounts?.length === 1;

        navigation.navigate('SignOutAccountSheet', {
            accountName,
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
    }, [navigation, accountName, accounts?.length, deleteAccount, toast, t]);
}
