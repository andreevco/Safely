import type { ReactNode } from 'react';
import { useMemo } from 'react';

import { AnalyticsService, EventsApi, RateApi } from '@safely/core';

import { AnalyticsContext } from './AnalyticsContext';
import { useBootConfig } from '../../shared/api/useBootConfig';
import { useAppContext } from '../../shared/providers';

export function AnalyticsProvider(props: { children: ReactNode }) {
    const { children } = props;

    const appContext = useAppContext();
    const bootConfig = useBootConfig();

    const service = useMemo(
        () =>
            new AnalyticsService({
                logger: appContext.logger.child('analytics'),
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
            appContext.logger,
            appContext.environment,
            appContext.build,
            appContext.version,
            bootConfig.telemetry.analytics.url,
            bootConfig.telemetry.analytics.token,
            bootConfig.currencies.prices_api_url
        ]
    );

    return <AnalyticsContext.Provider value={service}>{children}</AnalyticsContext.Provider>;
}
