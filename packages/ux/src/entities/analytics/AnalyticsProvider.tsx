import type { ReactNode } from 'react';
import { useMemo, useRef } from 'react';

import { AnalyticsService, EventsApi, RateApi, generateUuidV4 } from '@safely/core';

import type { AnalyticsContextValue } from './AnalyticsContext';
import { AnalyticsContext } from './AnalyticsContext';
import { useAccountUuid } from './useAccountUuid';
import { useBootConfig } from '../../shared/api/useBootConfig';
import { useAppContext } from '../../shared/providers';

type SessionKey = string | null;

export function AnalyticsProvider(props: { children: ReactNode }) {
    const { children } = props;

    const appContext = useAppContext();
    const bootConfig = useBootConfig();
    const { data: accountUuid } = useAccountUuid();
    const accountKey: SessionKey = accountUuid ?? null;

    const service = useMemo(
        () =>
            new AnalyticsService({
                logger: appContext.loggerRegistry.systemLogger.child('analytics'),
                eventsApi: new EventsApi({
                    baseUrl: bootConfig.telemetry.analytics.url,
                    projectToken: bootConfig.telemetry.analytics.token
                }),
                rateApi: new RateApi({ baseUrl: bootConfig.currencies.prices_api_url }),
                environment: appContext.environment,
                platform: appContext.build,
                appVersion: appContext.version
            }),
        [
            appContext.loggerRegistry.systemLogger,
            appContext.environment,
            appContext.build,
            appContext.version,
            bootConfig.telemetry.analytics.url,
            bootConfig.telemetry.analytics.token,
            bootConfig.currencies.prices_api_url
        ]
    );

    const sessionRef = useRef<{ key: SessionKey; id: string }>({
        key: null,
        id: generateUuidV4()
    });

    if (sessionRef.current.key !== accountKey) {
        sessionRef.current = { key: accountKey, id: generateUuidV4() };
    }

    const sessionId = sessionRef.current.id;

    const value = useMemo<AnalyticsContextValue>(
        () => ({ service, sessionId }),
        [service, sessionId]
    );

    return <AnalyticsContext.Provider value={value}>{children}</AnalyticsContext.Provider>;
}
