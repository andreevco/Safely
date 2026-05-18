import type { Logger } from '@safely/sync';

import type { EventsApi } from './api/events';
import type { AnalyticsEvent, Environment, SystemProps } from './api/events/models';
import { sAnalyticsEvent } from './api/events/models';
import type { Bucket } from './bucket/bucket-types';
import { getBucket } from './bucket/get-bucket';
import { RateCache } from './rate-cache';
import { SDK_VERSION } from './sdk-version';
import type { RateApi } from '../api/rate/client';
import type { Build } from '../entities/application/build.schema';
import { generateUuidV4 } from '../utils/uuid';

export interface AnalyticsDeps {
    logger: Logger;
    sessionId: string;
    eventsApi: EventsApi;
    rateApi: Pick<RateApi, 'getRate'>;
    systemProps: {
        environment: Environment;
        platform: Build;
        appVersion: string;
        lang: string;
    };
}

export class AnalyticsService {
    private logger: Logger;

    private readonly eventsApi: EventsApi;

    private readonly rateCache: RateCache;

    private readonly environment: Environment;

    private readonly platform: Build;

    private readonly appVersion: string;

    private readonly sessionId: string;

    private readonly oncePerSessionFired = new Set<string>();

    private accountUuid: string | null = null;

    private fiatSymbol: string | null = null;

    private lang: string;

    constructor(deps: AnalyticsDeps) {
        this.logger = deps.logger;
        this.eventsApi = deps.eventsApi;
        this.sessionId = deps.sessionId;
        this.lang = deps.systemProps.lang;
        this.platform = deps.systemProps.platform;
        this.appVersion = deps.systemProps.appVersion;
        this.environment = deps.systemProps.environment;
        this.rateCache = new RateCache(deps.rateApi);
    }

    public setLogger(logger: Logger): void {
        this.logger = logger;
    }

    public setLang(lang: string): void {
        this.lang = lang;
    }

    public setAccountUuid(uuid: string | null): void {
        this.accountUuid = uuid;
    }

    public setFiatSymbol(symbol: string | null): void {
        this.fiatSymbol = symbol;
    }

    public async trackOnboardingOpen(props: { onboardingId: string }): Promise<void> {
        await this.send({
            eventName: 'onboarding_open',
            props
        });
    }

    public async trackWalletOpen(input: {
        onboardingId: string;
        fiatAmount: number;
        sync: boolean;
    }): Promise<void> {
        const bucket = await this.computeBucket(input.fiatAmount, 'wallet_open');
        if (bucket === null) return;

        if (this.oncePerSessionFired.has('wallet_open')) return;

        this.oncePerSessionFired.add('wallet_open');
        await this.send({
            eventName: 'wallet_open',
            props: {
                bucket,
                sync: input.sync,
                onboardingId: input.onboardingId
            }
        });
    }

    public async trackSendStart(): Promise<void> {
        await this.send({ eventName: 'send_start', props: {} });
    }

    public async trackSendFinish(input: {
        cryptoCurrency: string;
        fiatAmount: number;
        errorType: string | null;
    }): Promise<void> {
        const bucket = await this.computeBucket(input.fiatAmount, 'send_finish');
        if (bucket === null) return;

        await this.send({
            eventName: 'send_finish',
            props: {
                bucket,
                currency: input.cryptoCurrency,
                errorType: input.errorType ?? 'none'
            }
        });
    }

    private async computeBucket(fiatAmount: number, eventName: string): Promise<Bucket | null> {
        if (this.fiatSymbol === null) {
            this.logger.warn('[analytics] no fiat configured, dropping event', { eventName });

            return null;
        }

        let rate: number;
        try {
            rate = await this.rateCache.get(this.fiatSymbol);
        } catch (err) {
            this.logger.warn('[analytics] no rate available, dropping event', {
                eventName,
                currency: this.fiatSymbol,
                err
            });

            return null;
        }

        return getBucket(fiatAmount * rate);
    }

    private async send(payload: Pick<AnalyticsEvent, 'eventName' | 'props'>): Promise<void> {
        const parsedPayload = sAnalyticsEvent.safeParse({
            eventId: generateUuidV4(),
            sessionId: this.sessionId,
            systemProps: this.buildSystemProps(),
            eventName: payload.eventName,
            props: payload.props
        });

        if (!parsedPayload.success) {
            this.logger.warn('[analytics] payload failed validation, dropping event', {
                eventName: payload.eventName,
                error: parsedPayload.error.message
            });

            return;
        }

        try {
            await this.eventsApi.send([parsedPayload.data]);
        } catch (err) {
            this.logger.warn('[analytics] failed to deliver event', {
                eventName: payload.eventName,
                err
            });
        }
    }

    private buildSystemProps(): SystemProps {
        return {
            ...(this.accountUuid !== null && { accountUuid: this.accountUuid }),
            lang: this.lang,
            platform: this.platform,
            appVersion: this.appVersion,
            environment: this.environment,
            sdkVersion: SDK_VERSION
        };
    }
}
