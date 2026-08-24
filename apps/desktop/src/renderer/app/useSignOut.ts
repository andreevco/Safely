import { useCallback } from 'react';

import { SyncStatus } from '@safely/sync';
import {
    useAccounts,
    useActiveAccount,
    useAppContext,
    useDeleteAccount,
    useEraseAllData,
    useErrorToast,
    useLoader,
    useToast,
    useTranslate
} from '@safely/ux';
import { PasscodePromptCancelledError } from '@safely/web-ui';

export function useSignOut() {
    const accounts = useAccounts();
    const account = useActiveAccount();
    const { mutateAsync: deleteAccount } = useDeleteAccount();
    const { mutateAsync: eraseAllData } = useEraseAllData();
    const { withLoader } = useLoader();
    const errorToast = useErrorToast({});
    const toast = useToast();
    const t = useTranslate();
    const {
        storage: {
            sync: { getSecureEncrypted }
        }
    } = useAppContext();

    return useCallback(async () => {
        const isLastAccount = accounts?.length === 1;

        const isSynced = account.syncProvider.syncStatusManager.getStatus() !== SyncStatus.OFFLINE;

        try {
            if (!isLastAccount || isSynced) {
                await withLoader(async () => {
                    using secureEncryptedStorage = getSecureEncrypted();

                    await secureEncryptedStorage.unlock();
                    await deleteAccount(secureEncryptedStorage);
                });
            }

            if (isLastAccount) {
                await eraseAllData();
                return;
            }

            toast({ message: t('settings.signOutAccount.toastAccountRemoved') });
        } catch (error) {
            if (error instanceof PasscodePromptCancelledError) {
                return;
            }

            errorToast(error);
        }
    }, [
        accounts,
        account,
        withLoader,
        getSecureEncrypted,
        deleteAccount,
        eraseAllData,
        toast,
        t,
        errorToast
    ]);
}
