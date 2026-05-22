import { useNavigation } from '@react-navigation/native';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import {
    useAccounts,
    useActiveAccountMeta,
    useDeleteAccount,
    useEraseAllData,
    useToast
} from '@safely/ux';

import { RootStackNavigationProp } from '@mobile/app/navigation/types';

export function useSignOutAccountConfirmation() {
    const { t } = useTranslation();
    const navigation = useNavigation<RootStackNavigationProp>();
    const accounts = useAccounts();
    const accountName = useActiveAccountMeta().name;
    const toast = useToast();
    const { mutateAsync: deleteAccount } = useDeleteAccount();
    const { mutateAsync: eraseAllData } = useEraseAllData();

    return useCallback(() => {
        const isLastAccount = accounts?.length === 1;

        navigation.navigate('SignOutAccountSheet', {
            accountName,
            onConfirm: async () => {
                if (isLastAccount) {
                    return eraseAllData();
                } else {
                    await deleteAccount();
                    toast(t('settings.signOutAccount.toastAccountRemoved'));
                }
            },
            onProtect: () => {
                navigation.navigate('SettingsModal', { screen: 'ProtectAccountModal' });
            }
        });
    }, [navigation, accountName, accounts?.length, deleteAccount, eraseAllData, toast, t]);
}
