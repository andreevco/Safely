import { IEnumerableStorage, ISyncSingleStorage } from '@safely/core';

import {
    ENCRYPTED_MOBILE_STORAGE_ONLY_APP_LEVEL_USE,
    mobileLayerSynchronousLocale,
    REGULAR_MOBILE_STORAGE_ONLY_APP_LEVEL_USE,
    SECURE_ENCRYPTED_MOBILE_STORAGE_ONLY_APP_LEVEL_USE
} from '@mobile/app/storage';

export type StorageViewer =
    | { name: string; kind: 'enumerable'; storage: IEnumerableStorage }
    | { name: string; kind: 'single'; storage: ISyncSingleStorage };

export const SINGLE_STORAGE_KEY = '(value)';

export const storageViewers: StorageViewer[] = [
    {
        name: 'app',
        kind: 'enumerable',
        storage: REGULAR_MOBILE_STORAGE_ONLY_APP_LEVEL_USE.enumerable
    },
    {
        name: 'encrypted',
        kind: 'enumerable',
        storage: ENCRYPTED_MOBILE_STORAGE_ONLY_APP_LEVEL_USE.enumerable
    },
    {
        name: 'secureEncrypted',
        kind: 'enumerable',
        storage: SECURE_ENCRYPTED_MOBILE_STORAGE_ONLY_APP_LEVEL_USE.enumerable
    },
    { name: 'locale', kind: 'single', storage: mobileLayerSynchronousLocale.storage }
];

export const findStorageViewer = (name: string): StorageViewer | undefined =>
    storageViewers.find(s => s.name === name);
