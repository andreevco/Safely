import type { ITreeStorage } from '@safely/sync';

export interface Security {
    check(options?: { title?: string }): Promise<void>;
}

export interface IUnlockableSecuredEncryptedStorage extends ITreeStorage {
    unlock: () => Promise<void>;
    UNSAFE_SKIP_SECURITY_CHECK_unlock: () => void;
    isLocked: boolean;
    [Symbol.dispose]: () => void;
}
