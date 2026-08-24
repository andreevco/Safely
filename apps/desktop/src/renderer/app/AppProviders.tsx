import type { FC, PropsWithChildren, ReactNode } from 'react';
import { Suspense, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { LoggableStorage, TreeStorage, WebNumberFormatLocale } from '@safely/core';
import type { IAppContext } from '@safely/ux';
import {
    AppContext,
    createPersister,
    createQueryClient,
    LedgerSessionPortProvider,
    noopLoaderService,
    QueryProvider,
    SyncStorageProvider,
    UnlockableSecuredEncryptedStorage
} from '@safely/ux';
import { ScreenProtectionProvider, toastService, ToastViewport, WebLinking } from '@safely/web-ui';

import { logger } from '../logger';
import { platform } from '../platform';
import {
    unsupportedLedgerSessionPort,
    unsupportedLedgerTransport,
    unsupportedQrScanner
} from '../platform/unsupported';

export interface AppProvidersProps {
    loader?: ReactNode;
}

const queryClient = createQueryClient(logger);
const persister = createPersister(
    TreeStorage.root(platform.storage.REGULAR_DESKTOP_STORAGE_ONLY_APP_LEVEL_USE).child(
        'persister'
    ),
    logger
);

export const AppProviders: FC<PropsWithChildren<AppProvidersProps>> = ({ loader, children }) => {
    const {
        t,
        i18n: { language }
    } = useTranslation();

    const appContext = useMemo<IAppContext>(() => {
        const { appInfo, storage, security } = platform;
        const regular = TreeStorage.root(storage.REGULAR_DESKTOP_STORAGE_ONLY_APP_LEVEL_USE);
        const encrypted = TreeStorage.root(storage.ENCRYPTED_DESKTOP_STORAGE_ONLY_APP_LEVEL_USE);

        return {
            version: appInfo.version,
            build: appInfo.build,
            environment: appInfo.environment,
            deviceInfo: {
                name: appInfo.deviceName,
                osVersion: appInfo.osVersion
            },
            /* no app store here, so only the OS region is known */
            getUserCountryInfo: () =>
                Promise.resolve({
                    storeCode: null,
                    deviceCode: appInfo.deviceCountryCode
                }),
            /* read once: no dev-tools UI to change them at runtime yet */
            devToken: storage.synchronous.get('devToken') ?? undefined,
            devIsTestnetAllowed: storage.synchronous.get('devIsTestnetAllowed') === 'true',
            numberFormatLocale: new WebNumberFormatLocale(appInfo.locale),
            storage: {
                ux: {
                    regular: regular.child('ux')
                },
                sync: {
                    regular: regular.child('sync'),
                    encrypted: encrypted.child('sync'),
                    /* The storage is real, the gate is not: `security` still reports itself
                       unavailable, so the unlockable wrapper refuses until a presence check
                       exists. */
                    getSecureEncrypted: () =>
                        new UnlockableSecuredEncryptedStorage(
                            new LoggableStorage(
                                storage.SECURE_ENCRYPTED_DESKTOP_STORAGE_ONLY_APP_LEVEL_USE,
                                logger,
                                'SecureEncryptedStorage'
                            ),
                            security,
                            ['sync']
                        )
                }
            },
            qrScanner: unsupportedQrScanner,
            toast: toastService,
            /* TODO(loader): a real overlay lands with the design-system components. */
            loader: noopLoaderService,
            linking: new WebLinking(logger, url => platform.openExternalUrl(url)),
            i18n: { language, t },
            logger,
            ledgerTransport: platform.ledgerTransport ?? unsupportedLedgerTransport,
            security,
            clearAllData: () => platform.clearAllData(),
            reloadApp: () => platform.reloadApp(),
            subscribeAppStateChange: callback => platform.subscribeAppStateChange(callback)
        };
    }, [language, t]);

    return (
        <QueryProvider persister={persister} queryClient={queryClient} loader={loader}>
            <AppContext value={appContext}>
                <ScreenProtectionProvider protect={platform.protectScreen}>
                    <Suspense fallback={loader}>
                        {/* TODO(ledger): a real transport replaces the rejecting port. */}
                        <LedgerSessionPortProvider port={unsupportedLedgerSessionPort}>
                            <SyncStorageProvider>{children}</SyncStorageProvider>
                        </LedgerSessionPortProvider>
                    </Suspense>
                </ScreenProtectionProvider>
                <ToastViewport />
            </AppContext>
        </QueryProvider>
    );
};
