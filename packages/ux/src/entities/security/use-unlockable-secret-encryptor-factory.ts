import { useCallback } from 'react';

import { useAppContext, UnlockableSecretEncryptor } from '../../shared';
import { useActiveAccount } from '../account';

export function useUnlockableSecretEncryptorFactory() {
    const account = useActiveAccount();
    const { getSecureEncryptedStorage } = useAppContext();

    return useCallback(
        () => new UnlockableSecretEncryptor(account.secretEncryptor, getSecureEncryptedStorage),
        [account.secretEncryptor, getSecureEncryptedStorage]
    );
}
