import type { FC, PropsWithChildren, ReactNode } from 'react';
import { Suspense, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';

import { LoggableStorage, TreeStorage, WebNumberFormatLocale } from '@safely/core';
import type { Logger } from '@safely/sync';
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
import type { WebPlatform } from '@safely/web-ui';
import {
    toastService,
    ToastViewport,
    unsupportedLedgerSessionPort,
    unsupportedLedgerTransport,
    unsupportedQrScanner,
    WebLinking
} from '@safely/web-ui';

export interface AppProvidersProps {
    platform: WebPlatform;

    /** Created by the app before React mounts — the storage adapters already log. */
    logger: Logger;

    /** Shown while the persisted query cache is being rehydrated. */
    loader?: ReactNode;
}

/**
 * Turns the `WebPlatform` implementation into the `IAppContext` every `@safely/ux` hook reads,
 * and wires the query client, the sync observer and the toast viewport around it — the desktop
 * counterpart of `apps/mobile/src/app/AppContext.tsx`.
 */
export const AppProviders: FC<PropsWithChildren<AppProvidersProps>> = ({
    platform,
    logger,
    loader,
    children
}) => {
    const {
        t,
        i18n: { language }
    } = useTranslation();

    /* one instance per mount: the query client and the persister must outlive renders */
    const [{ queryClient, persister }] = useState(() => {
        const root = TreeStorage.root(platform.storage.regular);

        return {
            queryClient: createQueryClient(logger),
            persister: createPersister(root.child('persister'), logger)
        };
    });

    const appContext = useMemo<IAppContext>(() => {
        const regular = TreeStorage.root(platform.storage.regular);
        const encrypted = TreeStorage.root(platform.storage.encrypted);
        const { appInfo, storage, security } = platform;

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
                    getSecureEncrypted: () =>
                        new UnlockableSecuredEncryptedStorage(
                            new LoggableStorage(
                                storage.createSecureEncrypted(),
                                logger,
                                'SecureEncryptedStorage'
                            ),
                            { check: options => security.check(options) },
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
            security: { check: options => security.check(options) },
            clearAllData: () => platform.clearAllData(),
            reloadApp: () => platform.reloadApp(),
            subscribeAppStateChange: callback => platform.subscribeAppStateChange(callback)
        };
    }, [platform, logger, language, t]);

    return (
        <QueryProvider persister={persister} queryClient={queryClient} loader={loader}>
            <AppContext value={appContext}>
                <Suspense fallback={loader}>
                    {/* TODO(ledger): a real transport replaces the rejecting port. */}
                    <LedgerSessionPortProvider port={unsupportedLedgerSessionPort}>
                        <SyncStorageProvider>{children}</SyncStorageProvider>
                    </LedgerSessionPortProvider>
                </Suspense>
                <ToastViewport />
            </AppContext>
        </QueryProvider>
    );
};
