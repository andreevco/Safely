import * as Device from 'expo-device';
import { getLocales } from 'expo-localization';
import { FC, PropsWithChildren, Suspense, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Platform } from 'react-native';

import { Build } from '@safely/core';
import { AppContext, IAppContext, UnlockableSecuredEncryptedStorage } from '@safely/ux';

import { navigationRef } from '@mobile/app/navigation/navigationRef';
import { useMobileSecurityCheck } from '@mobile/entities/security';
import { useToastServiceContext } from '@mobile/shared/providers/toast';
import { mobileStorages } from '@mobile/shared/storage';
import { MobileNumberFormatLocale } from '@mobile/shared/utils';

import packageJson from '../../package.json';

let securityCheck: () => Promise<void> = () => {
    throw new Error('Security check not initialized');
};

const build: Build =
    Platform.select({
        ios: 'ios' as const,
        android: 'android' as const,
        web: 'web' as const
    }) ?? ('web' as const);

const secureEncryptedStorage = new UnlockableSecuredEncryptedStorage(
    mobileStorages.secureEncrypted.storage,
    { check: securityCheck }
);

export const AppContextProvider: FC<PropsWithChildren> = ({ children }) => {
    const {
        t,
        i18n: { language }
    } = useTranslation();
    const { service: toastService } = useToastServiceContext();

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
            secureEncryptedStorage,
            qrScanner: {
                scan: options =>
                    new Promise<string>(resolve => {
                        // TODO
                        // @ts-ignore
                        window.qrResult = resolve;
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
        [t, toastService, language]
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
