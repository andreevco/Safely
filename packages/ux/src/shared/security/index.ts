import { useCallback } from 'react';

import { IEnumerableStorage, TreeStorage } from '@safely/core';
import { ITreeStorage } from '@safely/sync';

import { Security } from '../../entities';
import { useAppContext } from '../providers';

export function useSecurityCheck() {
    const { security } = useAppContext();
    return useCallback<Security['check']>((...params) => security.check(...params), [security]);
}

export interface IUnlockableSecuredEncryptedStorage extends ITreeStorage {
    unlock: () => Promise<void>;

    isLocked: boolean;

    [Symbol.dispose]: () => void;
}

export class UnlockableSecuredEncryptedStorage
    extends TreeStorage
    implements IUnlockableSecuredEncryptedStorage
{
    #isLocked = true;

    public get isLocked() {
        return this.#isLocked;
    }

    constructor(
        encryptedStorage: IEnumerableStorage,
        private readonly security: Security
    ) {
        const storage: IEnumerableStorage = {
            getItem: async (key: string) => {
                await this.securityCheck();
                return encryptedStorage.getItem(key);
            },
            setItem: async (key: string, value: string) => {
                await this.securityCheck();
                return encryptedStorage.setItem(key, value);
            },
            removeItem: async (key: string) => {
                await this.securityCheck();
                return encryptedStorage.removeItem(key);
            },
            clear: async () => {
                await this.securityCheck();
                return encryptedStorage.clear();
            },
            getAllKeys: async () => {
                await this.securityCheck();
                return encryptedStorage.getAllKeys();
            }
        };
        super([], storage);
    }

    private async securityCheck() {
        if (this.isLocked) {
            await this.security.check();
        }
    }

    public async unlock() {
        await this.security.check();
        this.#isLocked = false;
    }

    public [Symbol.dispose]() {
        this.#isLocked = true;
    }
}
