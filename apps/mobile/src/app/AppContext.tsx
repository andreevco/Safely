import { useToastServiceContext } from '@mobile/shared/providers/toast';
import { MobileNumberFormatLocale } from '@mobile/shared/utils';
import { getLocales } from 'expo-localization';
import i18next from 'i18next';
import { FC, PropsWithChildren, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { IAppSdk } from '@safely/core';
import { AppContext, IAppContext } from '@safely/ux';

const numberFormatLocale = new MobileNumberFormatLocale(getLocales()[0]);

const sdk: IAppSdk = {
    numberFormatLocale,
    // TODO: Implement later
    secretEncryptor: {
        decryptSecret: async () => {
            throw new Error('Not implemented');
        },
        encryptSecret: async () => {
            throw new Error('Not implemented');
        }
    },
    qrScanner: {
        scan: async () => {
            throw new Error('Not implemented');
        }
    },
    security: {
        check: async () => {
            throw new Error('Not implemented');
        }
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

    return <AppContext value={appContext}>{children}</AppContext>;
};
