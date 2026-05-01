import { IEnumerableStorage, ISyncSingleStorage } from '@safely/core';

import { storagesList } from '@mobile/app/storage';

export type StorageViewer =
    | { name: string; kind: 'enumerable'; storage: IEnumerableStorage }
    | { name: string; kind: 'single'; storage: ISyncSingleStorage };

export const SINGLE_STORAGE_KEY = '(value)';

export const storageViewers: StorageViewer[] = [
    { name: 'app', kind: 'enumerable', storage: storagesList.regular.enumerable },
    { name: 'encrypted', kind: 'enumerable', storage: storagesList.encrypted.enumerable },
    {
        name: 'secureEncrypted',
        kind: 'enumerable',
        storage: storagesList.secureEncrypted.enumerable
    },
    { name: 'locale', kind: 'single', storage: storagesList.mobileLayerSynchronousLocale.storage }
];

export const findStorageViewer = (name: string): StorageViewer | undefined =>
    storageViewers.find(s => s.name === name);
