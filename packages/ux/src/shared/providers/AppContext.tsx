import { createContext, useContext } from 'react';

import { Build, ITreeStorage, NumberFormatLocale, QrScanner, UserCountryInfo } from '@safely/core';
import { Logger } from '@safely/sync';

import { LoaderService, Security, ToastService } from '../../entities';
import { TranslateFn } from '../i18n';
import { IUnlockableSecuredEncryptedStorage } from '../security';

export type AppStateStatus = 'active' | 'background' | 'inactive' | 'unknown';

export interface IAppContext {
    version: string;

    build: Build;

    deviceInfo: {
        name: string;
        osVersion: string;
    };

    userCountryInfo?: UserCountryInfo;

    storage: ITreeStorage;

    encryptedStorage: ITreeStorage;

    getSecureEncryptedStorage(this: void): IUnlockableSecuredEncryptedStorage;

    qrScanner: QrScanner;

    numberFormatLocale: NumberFormatLocale;

    toast: ToastService;

    loader: LoaderService;

    i18n: {
        language: string;
        t: TranslateFn;
    };

    clearAllData: () => Promise<void>;

    logger: Logger;

    security: Security;

    subscribeAppStateChange(this: void, callback: (status: AppStateStatus) => void): () => void;
}

export const AppContext = createContext<IAppContext | null>(null);

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppContext must be used within AppContext provider');
    }

    return context;
};
