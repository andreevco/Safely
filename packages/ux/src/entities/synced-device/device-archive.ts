import { useMutation } from '@tanstack/react-query';

import { useActiveAccount } from '../account/account-state';
import { useActiveAccountSyncStorageSlotUpdate } from '../account/useAccountSyncStorageUpdate';

export function useArchiveDevice() {
    const account = useActiveAccount();
    const update = useActiveAccountSyncStorageSlotUpdate('devicesArchive');

    return useMutation<void, Error, string>({
        async mutationFn(ikPubHex) {
            await update(draft => {
                draft.entry(ikPubHex).set({
                    archivedAt: Date.now(),
                    archivedFromIkPubHex: account.getMyDeviceIkPub().toString('hex')
                });
            });
        }
    });
}

export function useUnarchiveDevice() {
    const update = useActiveAccountSyncStorageSlotUpdate('devicesArchive');

    return useMutation<void, Error, string>({
        async mutationFn(ikPubHex) {
            await update(draft => draft.delete(ikPubHex));
        }
    });
}
