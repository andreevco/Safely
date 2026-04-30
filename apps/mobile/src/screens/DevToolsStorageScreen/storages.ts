import { IEnumerableStorage, ISyncSingleStorage } from '@safely/core';

import { mobileStorages } from '@mobile/shared/storage';

export type StorageViewer =
    | { name: string; kind: 'enumerable'; storage: IEnumerableStorage }
    | { name: string; kind: 'single'; storage: ISyncSingleStorage };

export const SINGLE_STORAGE_KEY = '(value)';

export const storageViewers: StorageViewer[] = [
    { name: 'app', kind: 'enumerable', storage: mobileStorages.app.enumerable },
    { name: 'encrypted', kind: 'enumerable', storage: mobileStorages.encrypted.enumerable },
    {
        name: 'secureEncrypted',
        kind: 'enumerable',
        storage: mobileStorages.secureEncrypted.enumerable
    },
    { name: 'keychainMeta', kind: 'enumerable', storage: mobileStorages.keychainMeta.enumerable },
    { name: 'persister', kind: 'enumerable', storage: mobileStorages.persister.storage },
    { name: 'locale', kind: 'single', storage: mobileStorages.locale.storage }
];

export const findStorageViewer = (name: string): StorageViewer | undefined =>
    storageViewers.find(s => s.name === name);
