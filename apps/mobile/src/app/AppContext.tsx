import { getLocales } from 'expo-localization';
import i18next from 'i18next';
import { FC, PropsWithChildren, Suspense, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';

import { Build, IAppSdk, SSecretEncrypted } from '@safely/core';
import { AppContext, IAppContext } from '@safely/ux';

import { navigationRef } from '@mobile/app/navigation/navigationRef';
import { useMobileSecurityCheck } from '@mobile/entities/security';
import { useToastServiceContext } from '@mobile/shared/providers/toast';
import { mobileStorages } from '@mobile/shared/storage';
import { MobileNumberFormatLocale } from '@mobile/shared/utils';

import packageJson from '../../package.json';

const numberFormatLocale = new MobileNumberFormatLocale(getLocales()[0]);

let securityCheck: () => Promise<void> = () => {
    throw new Error('Security check not initialized');
};

const sdk: IAppSdk = {
    numberFormatLocale,
    storage: mobileStorages.app.storage,
    keychain: mobileStorages.keychain.storage,
    secretEncryptor: {
        decryptSecret: async (val: string) => {
            await securityCheck();
            return val; // TODO implement
        },
        encryptSecret: async (val: string) => {
            return val; // TODO implement
        },
        async removeSecretCache(_: SSecretEncrypted): Promise<void> {
            return;
        }
    },
    qrScanner: {
        scan: options =>
            new Promise<string>(resolve => {
                const t = i18next.t.bind(i18next);

                navigationRef.navigate('QRScanModal', {
                    onSuccess: resolve,
                    title: t(options?.titleTranslationKey ?? 'qrScan.title'),
                    subtitle: t(options?.subTranslationKey ?? 'qrScan.subtitle')
                });
            })
    }
};

const build: Build =
    Platform.select({
        ios: 'ios' as const,
        android: 'android' as const,
        web: 'web' as const
    }) ?? ('web' as const);

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
            version: packageJson.version,
            build,
            toast: {
                show: service.show
            },
            security: {
                check: () => securityCheck()
            },
            async clearAllData() {
                const storages = Object.values(mobileStorages);
                for (const storageConfig of storages) {
                    await storageConfig.storage.clear();
                }
            }
        }),
        [t, service]
    );

    return (
        <AppContext value={appContext}>
            <Suspense fallback={null}>
                <SecurityCheckInitializer />
            </Suspense>
            {children}
        </AppContext>
    );
};

const SecurityCheckInitializer: FC = () => {
    const check = useMobileSecurityCheck();

    useEffect(() => {
        securityCheck = check;
    }, [check]);

    return null;
};
