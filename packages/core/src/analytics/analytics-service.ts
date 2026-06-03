import { v4 as uuid4 } from 'uuid';

import type { Logger } from '@safely/sync';

import type { EventsApi } from './api/events';
import { BtcApiError } from '../api/btc/errors';
import type { RateApi } from '../api/rate/client';
import type { Build } from '../entities/application/build.schema';
import type { AnalyticsEvent, Environment, SystemProps } from './api/events/models';
import { sAnalyticsEvent } from './api/events/models';
import type { Bucket } from './bucket/bucket-types';
import { getBucket } from './bucket/get-bucket';
import { classifyAnalyticsSendError } from './errors';
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

    private readonly sessions = new Map<string, string>();

    private onboardingSession: string | null = null;

    constructor(deps: AnalyticsDeps) {
        this.logger = deps.logger.child('analytics');
        this.eventsApi = deps.eventsApi;
        this.environment = deps.environment;
        this.platform = deps.platform;
        this.appVersion = deps.appVersion;
        this.rateCache = new RateCache(deps.rateApi);
    }

    private resolveSessionId(accountUuid: string | null): string {
        if (!accountUuid) {
            return this.onboardingSession ?? (this.onboardingSession = uuid4());
        }

        // Promote onboarding session to the first account
        if (this.onboardingSession && this.sessions.size === 0) {
            const sessionToPromote = this.onboardingSession;
            this.sessions.set(accountUuid, sessionToPromote);
            this.onboardingSession = null;
            return sessionToPromote;
        }

        if (!this.sessions.has(accountUuid)) {
            this.sessions.set(accountUuid, uuid4());
        }

        return this.sessions.get(accountUuid)!;
    }

    public async trackOnboardingOpen(input: { onboardingId: string; lang: string }): Promise<void> {
        await this.send({
            eventName: 'onboarding_open',
            props: { onboardingId: input.onboardingId },
            lang: input.lang,
            sessionId: this.resolveSessionId(null),
            accountUuid: null
        });
    }

    public async trackWalletOpen(input: {
        accountUuid: string;
        fiatSymbol: string | null;
        lang: string;
        onboardingId: string | null;
        fiatAmount: number;
        sync: boolean;
    }): Promise<void> {
        const bucket = await this.computeBucket(input.fiatAmount, input.fiatSymbol, 'wallet_open');
        if (bucket === null) return;

        const sessionId = this.resolveSessionId(input.accountUuid);
        const key = `${sessionId}:wallet_open`;
        if (this.fired.has(key)) return;

        const isSent = await this.send({
            eventName: 'wallet_open',
            props: {
                bucket,
                sync: input.sync,
                ...(input.onboardingId !== null && { onboardingId: input.onboardingId })
            },
            lang: input.lang,
            sessionId,
            accountUuid: input.accountUuid
        });
        if (isSent) this.fired.add(key);
    }

    public async trackSendStart(input: { accountUuid: string; lang: string }): Promise<void> {
        await this.send({
            eventName: 'send_start',
            props: {},
            lang: input.lang,
            sessionId: this.resolveSessionId(input.accountUuid),
            accountUuid: input.accountUuid
        });
    }

    public async trackSendFinish(input: {
        accountUuid: string;
        fiatSymbol: string | null;
        lang: string;
        cryptoCurrency: string;
        fiatAmount: number;
        error?: unknown;
    }): Promise<void> {
        const bucket = await this.computeBucket(input.fiatAmount, input.fiatSymbol, 'send_finish');
        if (bucket === null) return;

        await this.send({
            eventName: 'send_finish',
            props: {
                bucket,
                currency: input.cryptoCurrency,
                errorType: input.error ? classifyAnalyticsSendError(input.error) : 'none'
            },
            lang: input.lang,
            sessionId: this.resolveSessionId(input.accountUuid),
            accountUuid: input.accountUuid
        });
    }

    private async computeBucket(
        fiatAmount: number,
        fiatSymbol: string | null,
        eventName: string
    ): Promise<Bucket | null> {
        if (fiatSymbol === null) {
            this.logger.warn('no fiat configured, dropping event', { eventName });

            return null;
        }

        let rate: number;
        try {
            rate = await this.rateCache.get(fiatSymbol);
        } catch (err) {
            this.logger.warn('no rate available, dropping event', {
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
            eventId: uuid4(),
            sessionId: payload.sessionId,
            systemProps: this.buildSystemProps(payload.lang, payload.accountUuid),
            eventName: payload.eventName,
            props: payload.props
        });

        if (!parsedPayload.success) {
            this.logger.warn('payload failed validation, dropping event', {
                eventName: payload.eventName
            });

            return false;
        }

        try {
            await this.eventsApi.send([parsedPayload.data]);

            return true;
        } catch (err) {
            this.logger.warn('failed to deliver event', {
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
