import { createContext, useContext } from 'react';

import { Build, ITreeStorage, NumberFormatLocale, QrScanner, UserCountryInfo } from '@safely/core';

import { Security, ToastService } from '../../entities';
import { TranslateFn } from '../i18n';
import { IUnlockableSecuredEncryptedStorage } from '../security';

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

    secureEncryptedStorage: IUnlockableSecuredEncryptedStorage;

    qrScanner: QrScanner;

    numberFormatLocale: NumberFormatLocale;

    toast: ToastService;

    i18n: {
        language: string;
        t: TranslateFn;
    };

    clearAllData: () => Promise<void>;

    security: Security;
}

export const AppContext = createContext<IAppContext | null>(null);

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppContext must be used within AppContext provider');
    }

    return context;
};
