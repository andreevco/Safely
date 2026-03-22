import { useNavigation } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import {
    useAccounts,
    useActiveAccount,
    useActiveAccountQueryKey,
    useDeleteAccount,
    useSetActiveAccount,
    useToast
} from '@safely/ux';

import { RootStackNavigationProp } from '@mobile/app/navigation/types';

import { getAccountSyncState } from '../../screens/SignOutAccountSheet/getAccountSyncState';

interface PendingSignOut {
    accountId: string;
    remainingAccountIds: string[];
}

export function useSignOutAccountConfirmation() {
    const { t } = useTranslation();
    const navigation = useNavigation<RootStackNavigationProp>();
    const accounts = useAccounts();
    const account = useActiveAccount();
    const queryClient = useQueryClient();
    const toast = useToast();
    const { mutateAsync: deleteAccount } = useDeleteAccount();
    const { mutateAsync: setActiveAccount } = useSetActiveAccount();
    const accountQueryKey = useActiveAccountQueryKey();

    const pendingSignOut = useRef<PendingSignOut | null>(null);

    useEffect(() => {
        const unsubscribe = navigation.addListener('focus', async () => {
            const pending = pendingSignOut.current;
            if (!pending) return;
            pendingSignOut.current = null;

            try {
                await deleteAccount();
            } catch {
                return;
            }

            if (pending.remainingAccountIds.length > 0) {
                await setActiveAccount(pending.remainingAccountIds[0]);
            } else {
                navigation.reset({
                    index: 0,
                    routes: [{ name: 'WelcomeScreen' }]
                });
            }

            toast(t('settings.signOutAccount.toastAccountRemoved'));
        });

        return unsubscribe;
    }, [navigation, deleteAccount, setActiveAccount, toast, t]);

    return useCallback(() => {
        const devicesMeta = account.syncProvider.get('devicesMeta');
        const myIkPubHex = queryClient.getQueryData<string>(
            accountQueryKey.devices.currentIkPub.toKey()
        );
        const syncState = getAccountSyncState(devicesMeta, myIkPubHex ?? '');

        const remainingAccountIds = (accounts ?? [])
            .filter(acc => acc.accountId !== account.accountId)
            .map(acc => acc.accountId);

        navigation.navigate('SignOutAccountSheet', {
            accountName: account.meta.name,
            syncState,
            onConfirm: () => {
                pendingSignOut.current = {
                    accountId: account.accountId,
                    remainingAccountIds
                };
            },
            onProtect: () => {
                navigation.navigate('SettingsModal', { screen: 'ProtectAccountModal' });
            }
        });
    }, [navigation, account, accounts, accountQueryKey, queryClient]);
}
