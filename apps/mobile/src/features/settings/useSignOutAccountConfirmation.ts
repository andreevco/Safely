import { useNavigation } from '@react-navigation/core';
import { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { SyncStatus } from '@safely/sync';
import {
    useAccounts,
    useActiveAccount,
    useActiveAccountMeta,
    useAppContext,
    useDeleteAccount,
    useEraseAllData,
    useToast
} from '@safely/ux';

export function useSignOutAccountConfirmation() {
    const { t } = useTranslation();
    const navigation = useNavigation();
    const accounts = useAccounts();
    const activeAccount = useActiveAccount();
    const accountName = useActiveAccountMeta().name;
    const toast = useToast();
    const { mutateAsync: deleteAccount } = useDeleteAccount();
    const { mutateAsync: eraseAllData } = useEraseAllData();
    const { logger, storage } = useAppContext();

    return useCallback(() => {
        const isLastAccount = accounts?.length === 1;
        const isSyncAccount =
            activeAccount.syncProvider.syncStatusManager.getStatus() !== SyncStatus.OFFLINE;

        navigation.navigate('SignOutAccountSheet', {
            accountName,
            withLoader: isSyncAccount,
            onConfirm: async () => {
                using secureEncryptedStorage = storage.sync.getSecureEncrypted();
                await secureEncryptedStorage.unlock();

                if (isLastAccount) {
                    if (isSyncAccount) {
                        try {
                            await deleteAccount(secureEncryptedStorage);
                        } catch (e) {
                            logger.error('Failed to delete account', e);
                        }
                    }

                    await eraseAllData();
                } else {
                    await deleteAccount();
                    toast(t('settings.signOutAccount.toastAccountRemoved'));
                }
            }
        });
    }, [
        navigation,
        accountName,
        accounts?.length,
        activeAccount,
        deleteAccount,
        eraseAllData,
        toast,
        t
    ]);
}
