import { useCallback } from 'react';

import { useAppContext, UnlockableSecretEncryptor } from '../../shared';
import { useActiveAccount } from '../account';

export function useUnlockableSecretEncryptorFactory() {
    const account = useActiveAccount();
    const { storage } = useAppContext();

    return useCallback(
        () =>
            new UnlockableSecretEncryptor(account.secretEncryptor, storage.sync.getSecureEncrypted),
        [account.secretEncryptor, storage.sync.getSecureEncrypted]
    );
}
