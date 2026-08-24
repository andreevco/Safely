import type { FC, ReactNode } from 'react';
import { createContext, use } from 'react';

import type { PasscodeStorage } from './types';

const PasscodeStorageContext = createContext<PasscodeStorage | null>(null);

export type PasscodeStorageProviderProps = {
    storage: PasscodeStorage;
    children: ReactNode;
};

export const PasscodeStorageProvider: FC<PasscodeStorageProviderProps> = props => (
    <PasscodeStorageContext value={props.storage}>{props.children}</PasscodeStorageContext>
);

export function usePasscodeStorage(): PasscodeStorage {
    const storage = use(PasscodeStorageContext);

    if (storage === null) {
        throw new Error('PasscodeStorageProvider is missing above this component.');
    }

    return storage;
}
