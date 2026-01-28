import { createContext, useContext } from 'react';

import { Build, UserCountryInfo } from '@safely/core';

import { ToastService } from '../../entities';
import { TranslateFn } from '../i18n';

export interface IAppContext {
    version: string; // x.y.z
    build: Build;
    userCountryInfo?: UserCountryInfo;
    sdk: unknown; // TODO Implement IAppSdk
    toast: ToastService;
    i18n: {
        language: string;
        t: TranslateFn;
    };
}

export const AppContext = createContext<IAppContext | null>(null);

export const useAppSdk = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppSdk must be used within AppContext provider');
    }

    return context.sdk;
};

export const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) {
        throw new Error('useAppContext must be used within AppContext provider');
    }

    return context;
};
