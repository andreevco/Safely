import { createContext, useContext } from 'react';

import { Build, ITreeStorage, NumberFormatLocale, QrScanner, UserCountryInfo } from '@safely/core';

import type { TranslateFn } from '../i18n/types';
import type { LoaderService } from '../loader/types';
import type { ILoggerRegistry } from '../logger';
import type { IUnlockableSecuredEncryptedStorage, Security } from '../security/types';
import type { ToastService } from '../toast/types';

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

    loggerRegistry: ILoggerRegistry;

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
