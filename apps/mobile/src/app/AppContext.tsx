import { useSecurityCheck } from '@mobile/entities/security';
import { useToastServiceContext } from '@mobile/shared/providers/toast';
import { createMMKVTreeStorage } from '@mobile/shared/storage/mmkv';
import { MobileNumberFormatLocale } from '@mobile/shared/utils';
import { getLocales } from 'expo-localization';
import i18next from 'i18next';
import { FC, PropsWithChildren, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { IAppSdk } from '@safely/core';
import { AppContext, IAppContext } from '@safely/ux';

const numberFormatLocale = new MobileNumberFormatLocale(getLocales()[0]);

let securityCheck: () => Promise<boolean> = () => {
    throw new Error('Security check not initialized');
};

const sdk: IAppSdk = {
    numberFormatLocale,
    storage: createMMKVTreeStorage('app').storage,
    secretEncryptor: {
        decryptSecret: async (val: string) => {
            const passed = await sdk.security.check();
            if (!passed) {
                throw new Error('Security check failed');
            }
            return val; // TODO implement
        },
        encryptSecret: async (val: string) => {
            return val; // TODO implement
        }
    },
    qrScanner: {
        scan: async () => {
            throw new Error('Not implemented');
        }
    },
    security: {
        check: () => securityCheck()
    }
};

export const AppContextProvider: FC<PropsWithChildren> = ({ children }) => {
    const { t } = useTranslation();
    const { service } = useToastServiceContext();

    const appContext = useMemo<IAppContext>(
        () => ({
            i18n: {
                language: i18next.language,
                t
            },
            sdk,
            version: '1.0.0',
            build: 'ios',
            toast: {
                show: service.show
            }
        }),
        [t, service]
    );

    return (
        <AppContext value={appContext}>
            <SecurityCheckProvider>{children}</SecurityCheckProvider>
        </AppContext>
    );
};

const SecurityCheckProvider: FC<PropsWithChildren> = ({ children }) => {
    const check = useSecurityCheck();

    useEffect(() => {
        securityCheck = check.check;
    }, [check.check]);

    return children;
};
