import type { Logger } from '@safely/sync';

import { BtcApiError } from '../api/btc/errors';
import type { RateApi } from '../api/rate/client';
import type { Build } from '../entities/application/build.schema';
import { generateUuidV4 } from '../utils/uuid';
import type { EventsApi } from './api/events';
import type { AnalyticsEvent, Environment, SystemProps } from './api/events/models';
import { sAnalyticsEvent } from './api/events/models';
import type { Bucket } from './bucket/bucket-types';
import { getBucket } from './bucket/get-bucket';
import { RateCache } from './rate-cache';
import { SDK_VERSION } from './sdk-version';

export interface AnalyticsDeps {
    logger: Logger;
    eventsApi: EventsApi;
    rateApi: Pick<RateApi, 'getRate'>;
    environment: Environment;
    platform: Build;
    appVersion: string;
}

export class AnalyticsService {
    private readonly logger: Logger;

    private readonly eventsApi: EventsApi;

    private readonly rateCache: RateCache;

    private readonly environment: Environment;

    private readonly platform: Build;

    private readonly appVersion: string;

    private readonly fired = new Set<string>();

    constructor(deps: AnalyticsDeps) {
        this.logger = deps.logger;
        this.eventsApi = deps.eventsApi;
        this.environment = deps.environment;
        this.platform = deps.platform;
        this.appVersion = deps.appVersion;
        this.rateCache = new RateCache(deps.rateApi);
    }

    public async trackOnboardingOpen(input: {
        onboardingId: string;
        lang: string;
        sessionId: string;
    }): Promise<void> {
        await this.send({
            eventName: 'onboarding_open',
            props: { onboardingId: input.onboardingId },
            lang: input.lang,
            sessionId: input.sessionId,
            accountUuid: null
        });
    }

    public async trackWalletOpen(input: {
        accountUuid: string;
        sessionId: string;
        fiatSymbol: string | null;
        lang: string;
        onboardingId: string;
        fiatAmount: number;
        sync: boolean;
    }): Promise<void> {
        const bucket = await this.computeBucket(input.fiatAmount, input.fiatSymbol, 'wallet_open');
        if (bucket === null) return;

        const key = `${input.sessionId}:wallet_open`;
        if (this.fired.has(key)) return;

        const isSent = await this.send({
            eventName: 'wallet_open',
            props: {
                bucket,
                sync: input.sync,
                onboardingId: input.onboardingId
            },
            lang: input.lang,
            sessionId: input.sessionId,
            accountUuid: input.accountUuid
        });
        if (isSent) this.fired.add(key);
    }

    public async trackSendStart(input: {
        accountUuid: string;
        sessionId: string;
        lang: string;
    }): Promise<void> {
        await this.send({
            eventName: 'send_start',
            props: {},
            lang: input.lang,
            sessionId: input.sessionId,
            accountUuid: input.accountUuid
        });
    }

    public async trackSendFinish(input: {
        accountUuid: string;
        sessionId: string;
        fiatSymbol: string | null;
        lang: string;
        cryptoCurrency: string;
        fiatAmount: number;
        errorType: string | null;
    }): Promise<void> {
        const bucket = await this.computeBucket(input.fiatAmount, input.fiatSymbol, 'send_finish');
        if (bucket === null) return;

        await this.send({
            eventName: 'send_finish',
            props: {
                bucket,
                currency: input.cryptoCurrency,
                errorType: input.errorType ?? 'none'
            },
            lang: input.lang,
            sessionId: input.sessionId,
            accountUuid: input.accountUuid
        });
    }

    private async computeBucket(
        fiatAmount: number,
        fiatSymbol: string | null,
        eventName: string
    ): Promise<Bucket | null> {
        if (fiatSymbol === null) {
            this.logger.warn('[analytics] no fiat configured, dropping event', { eventName });

            return null;
        }

        let rate: number;
        try {
            rate = await this.rateCache.get(fiatSymbol);
        } catch (err) {
            this.logger.warn('[analytics] no rate available, dropping event', {
                eventName,
                currency: fiatSymbol,
                status: err instanceof BtcApiError ? err.status : null
            });

            return null;
        }

        return getBucket(fiatAmount * rate);
    }

    private async send(payload: {
        eventName: AnalyticsEvent['eventName'];
        props: object;
        lang: string;
        sessionId: string;
        accountUuid: string | null;
    }): Promise<boolean> {
        const parsedPayload = sAnalyticsEvent.safeParse({
            eventId: generateUuidV4(),
            sessionId: payload.sessionId,
            systemProps: this.buildSystemProps(payload.lang, payload.accountUuid),
            eventName: payload.eventName,
            props: payload.props
        });

        if (!parsedPayload.success) {
            this.logger.warn('[analytics] payload failed validation, dropping event', {
                eventName: payload.eventName
            });

            return false;
        }

        try {
            await this.eventsApi.send([parsedPayload.data]);

            return true;
        } catch (err) {
            this.logger.warn('[analytics] failed to deliver event', {
                eventName: payload.eventName,
                status: err instanceof BtcApiError ? err.status : null
            });

            return false;
        }
    }

    private buildSystemProps(lang: string, accountUuid: string | null): SystemProps {
        return {
            ...(accountUuid !== null && { accountUuid }),
            lang,
            platform: this.platform,
            appVersion: this.appVersion,
            environment: this.environment,
            sdkVersion: SDK_VERSION
        };
    }
}
