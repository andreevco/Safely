import { getLocales } from 'expo-localization';
import { reloadAppAsync as reloadApp } from 'expo-modules-core';
import type { FC, PropsWithChildren } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState } from 'react-native';

import { LoggableStorage } from '@safely/core';
import type { AppStateStatus, IAppContext, Security } from '@safely/ux';
import { AppContext, UnlockableSecuredEncryptedStorage } from '@safely/ux';

import { useMobileSecurityCheck } from '@mobile/features/security';
import { build, deviceInfo, environment } from '@mobile/shared/app-meta';
import { eraseLogs, logger } from '@mobile/shared/logger';
import { useLoaderServiceContext } from '@mobile/shared/providers/loader';
import { useToastServiceContext } from '@mobile/shared/providers/toast';
import { MobileNumberFormatLocale, MobileAppLinking } from '@mobile/shared/utils';

import { navigationRef } from './navigation/navigationRef';
import {
    CLEAR_ALL_MOBILE_STORAGE_ONLY_APP_LEVEL_USE_DANGER,
    ENCRYPTED_MOBILE_STORAGE_ONLY_APP_LEVEL_USE,
    mobileLayerSynchronousDevIsTestnetAllowed,
    mobileLayerSynchronousDevToken,
    REGULAR_MOBILE_STORAGE_ONLY_APP_LEVEL_USE,
    SECURE_ENCRYPTED_MOBILE_STORAGE_ONLY_APP_LEVEL_USE
} from './storage';
import packageJson from '../../package.json';

const security: Security = {
    check() {
        throw new Error('Security check not initialized');
    }
};

function resolveAppStateStatus(state: string): AppStateStatus {
    switch (state) {
        case 'active':
        case 'background':
        case 'inactive':
            return state;
        case 'extension':
        case 'unknown':
        default:
            return 'unknown';
    }
}

export const AppContextProvider: FC<PropsWithChildren> = ({ children }) => {
    const {
        t,
        i18n: { language }
    } = useTranslation();
    const { service: toastService } = useToastServiceContext();
    const { service: loaderService } = useLoaderServiceContext();
    const devIsTestnetAllowed = useDevIsTestnetAllowed();

    const appContext = useMemo<IAppContext>(
        () => ({
            i18n: {
                language,
                t
            },
            version: packageJson.version,
            build,
            environment,
            devToken: mobileLayerSynchronousDevToken.storage.get() ?? undefined,
            devIsTestnetAllowed,
            deviceInfo,
            numberFormatLocale: new MobileNumberFormatLocale(getLocales()[0]),
            storage: {
                ux: {
                    regular: REGULAR_MOBILE_STORAGE_ONLY_APP_LEVEL_USE.storage.child('ux')
                },
                sync: {
                    regular: REGULAR_MOBILE_STORAGE_ONLY_APP_LEVEL_USE.storage.child('sync'),
                    encrypted: ENCRYPTED_MOBILE_STORAGE_ONLY_APP_LEVEL_USE.storage.child('sync'),
                    getSecureEncrypted() {
                        return new UnlockableSecuredEncryptedStorage(
                            new LoggableStorage(
                                SECURE_ENCRYPTED_MOBILE_STORAGE_ONLY_APP_LEVEL_USE.enumerable,
                                logger,
                                'SecureEncryptedStorage'
                            ),
                            security,
                            ['sync']
                        );
                    }
                }
            },
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
            logger,
            linking: new MobileAppLinking(logger),
            security: {
                check: () => security.check()
            },
            clearAllData: async () => {
                await CLEAR_ALL_MOBILE_STORAGE_ONLY_APP_LEVEL_USE_DANGER();
                eraseLogs();
            },
            reloadApp,
            subscribeAppStateChange(callback) {
                callback(resolveAppStateStatus(AppState.currentState));

                const subscription = AppState.addEventListener('change', state => {
                    callback(resolveAppStateStatus(state));
                });
                return () => subscription.remove();
            }
        }),
        [t, toastService, loaderService, language, devIsTestnetAllowed]
    );

    return <AppContext value={appContext}>{children}</AppContext>;
};

// reflects dev settings toggle without app reload
function useDevIsTestnetAllowed() {
    const [devIsTestnetAllowed, setDevIsTestnetAllowed] = useState(
        () => mobileLayerSynchronousDevIsTestnetAllowed.storage.get() === 'true'
    );

    useEffect(() => {
        const subscription =
            mobileLayerSynchronousDevIsTestnetAllowed.mmkv.addOnValueChangedListener(() => {
                setDevIsTestnetAllowed(
                    mobileLayerSynchronousDevIsTestnetAllowed.storage.get() === 'true'
                );
            });
        return () => subscription.remove();
    }, []);

    return devIsTestnetAllowed;
}

export const SecurityCheckInitializer: FC = () => {
    const check = useMobileSecurityCheck();

    useEffect(() => {
        security.check = check;
    }, [check]);

    return null;
};
