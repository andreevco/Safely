import * as Device from 'expo-device';
import { getLocales } from 'expo-localization';
import { FC, PropsWithChildren, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';

import { Build } from '@safely/core';
import { AppContext, IAppContext, Security, UnlockableSecuredEncryptedStorage } from '@safely/ux';

import { navigationRef } from '@mobile/app/navigation/navigationRef';
import { useMobileSecurityCheck } from '@mobile/entities/security';
import { useLoaderServiceContext } from '@mobile/shared/providers/loader';
import { useToastServiceContext } from '@mobile/shared/providers/toast';
import { mobileStorages } from '@mobile/shared/storage';
import { MobileNumberFormatLocale } from '@mobile/shared/utils';

import packageJson from '../../package.json';

const security: Security = {
    check() {
        throw new Error('Security check not initialized');
    }
};

const build: Build =
    Platform.select({
        ios: 'ios' as const,
        android: 'android' as const,
        web: 'web' as const
    }) ?? ('web' as const);

const getSecureEncryptedStorage = () =>
    new UnlockableSecuredEncryptedStorage(mobileStorages.secureEncrypted.storage, security);

export const AppContextProvider: FC<PropsWithChildren> = ({ children }) => {
    const {
        t,
        i18n: { language }
    } = useTranslation();
    const { service: toastService } = useToastServiceContext();
    const { service: loaderService } = useLoaderServiceContext();

    const appContext = useMemo<IAppContext>(
        () => ({
            i18n: {
                language,
                t
            },
            version: packageJson.version,
            build,
            deviceInfo: {
                name: Device.modelName ?? (Platform.OS === 'ios' ? 'iPhone' : 'Android device'),
                osVersion: Device.osVersion ?? String(Platform.Version)
            },
            numberFormatLocale: new MobileNumberFormatLocale(getLocales()[0]),
            storage: mobileStorages.app.storage,
            encryptedStorage: mobileStorages.encrypted.storage,
            getSecureEncryptedStorage,
            qrScanner: {
                scan: options =>
                    new Promise<string>(resolve => {
                        navigationRef.navigate('QRScanModal', {
                            onSuccess: resolve,
                            title: t(options?.titleTranslationKey ?? 'qrScan.title'),
                            subtitle: t(options?.subTranslationKey ?? 'qrScan.subtitle')
                        });
                    })
            },
            toast: {
                show: toastService.show
            },
            loader: {
                show: loaderService.show,
                hide: loaderService.hide,
                withLoader: loaderService.withLoader
            },
            security: {
                check: () => security.check()
            },
            async clearAllData() {
                const storages = Object.values(mobileStorages);
                for (const storageConfig of storages) {
                    await storageConfig.storage.clear();
                }
            }
        }),
        [t, toastService, loaderService, language]
    );

    return (
        <AppContext value={appContext}>
            <SecurityCheckInitializer />
            {children}
        </AppContext>
    );
};

const SecurityCheckInitializer: FC = () => {
    const check = useMobileSecurityCheck();

    useEffect(() => {
        security.check = check;
    }, [check]);

    return null;
};
