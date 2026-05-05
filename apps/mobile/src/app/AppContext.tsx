import { getLocales } from 'expo-localization';
import { FC, PropsWithChildren, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState } from 'react-native';

import {
    AppContext,
    IAppContext,
    Security,
    UnlockableSecuredEncryptedStorage,
    useLoggerLifecycle
} from '@safely/ux';

import { navigationRef } from '@mobile/app/navigation/navigationRef';
import { useMobileSecurityCheck } from '@mobile/entities/security';
import { build, deviceInfo } from '@mobile/shared/app-meta';
import { loggerRegistry } from '@mobile/shared/logger';
import { useLoaderServiceContext } from '@mobile/shared/providers/loader';
import { useToastServiceContext } from '@mobile/shared/providers/toast';
import { MobileNumberFormatLocale, MobileAppLinking } from '@mobile/shared/utils';

import {
    CLEAR_ALL_MOBILE_STORAGE_ONLY_APP_LEVEL_USE_DANGER,
    ENCRYPTED_MOBILE_STORAGE_ONLY_APP_LEVEL_USE,
    REGULAR_MOBILE_STORAGE_ONLY_APP_LEVEL_USE,
    SECURE_ENCRYPTED_MOBILE_STORAGE_ONLY_APP_LEVEL_USE
} from './storage';
import packageJson from '../../package.json';

const security: Security = {
    check() {
        throw new Error('Security check not initialized');
    }
};

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
                            SECURE_ENCRYPTED_MOBILE_STORAGE_ONLY_APP_LEVEL_USE.enumerable,
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
            loggerRegistry,
            linking: new MobileAppLinking(loggerRegistry.systemLogger),
            security: {
                check: () => security.check()
            },
            clearAllData: CLEAR_ALL_MOBILE_STORAGE_ONLY_APP_LEVEL_USE_DANGER,
            subscribeAppStateChange(callback) {
                const subscription = AppState.addEventListener('change', state => {
                    switch (state) {
                        case 'active':
                        case 'background':
                        case 'inactive':
                            return callback(state);
                        case 'extension':
                        case 'unknown':
                            return callback('unknown');
                    }
                });
                return () => subscription.remove();
            }
        }),
        [t, toastService, loaderService, language]
    );

    return (
        <AppContext value={appContext}>
            <SecurityCheckInitializer />
            <LoggerLifecycle />
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

const LoggerLifecycle: FC = () => {
    useLoggerLifecycle();

    return null;
};
