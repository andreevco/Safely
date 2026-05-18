import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { useEffect, useMemo } from 'react';

import { AnalyticsService, EventsApi, RateApi, deriveAnalyticsAccountUuid } from '@safely/core';

import { analyticsKeys } from './keys';
import { AnalyticsContext } from '../../shared/analytics/AnalyticsContext';
import { useBootConfig } from '../../shared/api/useBootConfig';
import { useActiveLanguage } from '../../shared/i18n/translate';
import { useAppContext } from '../../shared/providers';
import { useActiveAccountQuery } from '../account/account-state';
import type { SyncAccount } from '../account/account-state';
import { useActiveFiat } from '../fiat/useActiveFiat';
import { useLogger } from '../logger/use-logger';

export function AnalyticsProvider(props: { children: ReactNode }) {
    const { children } = props;

    const lang = useActiveLanguage();
    const appContext = useAppContext();
    const bootConfig = useBootConfig();
    const { data: activeAccount } = useActiveAccountQuery();

    const baseLogger = useLogger();
    const logger = useMemo(() => baseLogger.child('analytics'), [baseLogger]);

    const eventsApi = useMemo(
        () =>
            new EventsApi({
                baseUrl: bootConfig.telemetry.analytics.url,
                projectToken: bootConfig.telemetry.analytics.token
            }),
        [bootConfig.telemetry.analytics.url, bootConfig.telemetry.analytics.token]
    );

    const rateApi = useMemo(
        () => new RateApi({ baseUrl: bootConfig.currencies.prices_api_url }),
        [bootConfig.currencies.prices_api_url]
    );

    const service = useMemo(
        () =>
            new AnalyticsService({
                logger,
                eventsApi,
                rateApi,
                systemProps: {
                    environment: appContext.environment,
                    platform: appContext.build,
                    appVersion: appContext.version,
                    lang
                },
                sessionId: appContext.sessionId
            }),
        // logger and lang change should not trigger a new AnalyticsService instance creation
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [
            rateApi,
            eventsApi,
            appContext.build,
            appContext.version,
            appContext.sessionId,
            appContext.environment
        ]
    );

    useEffect(() => {
        service.setLogger(logger);
    }, [service, logger]);

    useEffect(() => {
        service.setLang(lang);
    }, [service, lang]);

    return (
        <AnalyticsContext.Provider value={service}>
            {activeAccount ? (
                <AccountWiring service={service} activeAccount={activeAccount} />
            ) : null}
            {children}
        </AnalyticsContext.Provider>
    );
}

function AccountWiring(props: { service: AnalyticsService; activeAccount: SyncAccount }) {
    const { service, activeAccount } = props;

    const activeFiat = useActiveFiat();
    const appContext = useAppContext();

    const getSecureEncrypted = appContext.storage.sync.getSecureEncrypted;

    const accountUuidQuery = useQuery({
        queryKey: analyticsKeys.accountUuid(activeAccount.accountId).toKey(),
        queryFn: async () => {
            using secureStorage = getSecureEncrypted();
            secureStorage.UNSAFE_SKIP_SECURITY_CHECK_unlock();

            return await activeAccount.withMasterKey(secureStorage, mk =>
                deriveAnalyticsAccountUuid(mk)
            );
        }
    });

    useEffect(() => {
        service.setAccountUuid(accountUuidQuery.data ?? null);

        return () => service.setAccountUuid(null);
    }, [service, accountUuidQuery.data]);

    useEffect(() => {
        service.setFiatSymbol(activeFiat.id.symbol);

        return () => service.setFiatSymbol(null);
    }, [service, activeFiat.id.symbol]);

    return null;
}
