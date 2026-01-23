import { createContext, useContext } from 'react';

import type { ToastService } from '../hooks';

export interface IAppContext {
    version: string; // x.y.z
    sdk: unknown; // TODO Implement IAppSdk
    toast: ToastService;
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
