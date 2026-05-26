import z from 'zod';

import { sBuild } from '../../../entities/application/build.schema';
import { sBucket } from '../../bucket/bucket-types';

export const sEnvironment = z.enum(['production', 'development']);
export type Environment = z.infer<typeof sEnvironment>;

export const sSystemProps = z.object({
    accountUuid: z.uuid().optional(),
    environment: sEnvironment,
    lang: z.string(),
    platform: sBuild,
    appVersion: z.string().max(64),
    sdkVersion: z.number().int().min(1)
});
export type SystemProps = z.infer<typeof sSystemProps>;

export const sOnboardingOpenProps = z.object({
    onboardingId: z.string().max(64)
});

export const sWalletOpenProps = z.object({
    bucket: sBucket,
    sync: z.boolean(),
    onboardingId: z.string().max(64).optional()
});

export const sSendStartProps = z.object({});

export const sSendFinishProps = z.object({
    bucket: sBucket,
    currency: z.string().max(128),
    errorType: z.string().max(128)
});

export const sEventBase = z.object({
    eventId: z.uuid(),
    sessionId: z.uuid(),
    systemProps: sSystemProps
});

export const sOnboardingOpenEvent = sEventBase.extend({
    eventName: z.literal('onboarding_open'),
    props: sOnboardingOpenProps
});

export const sWalletOpenEvent = sEventBase.extend({
    eventName: z.literal('wallet_open'),
    props: sWalletOpenProps
});

export const sSendStartEvent = sEventBase.extend({
    eventName: z.literal('send_start'),
    props: sSendStartProps
});

export const sSendFinishEvent = sEventBase.extend({
    eventName: z.literal('send_finish'),
    props: sSendFinishProps
});

export const sAnalyticsEvent = z.discriminatedUnion('eventName', [
    sOnboardingOpenEvent,
    sWalletOpenEvent,
    sSendStartEvent,
    sSendFinishEvent
]);

export type AnalyticsEvent = z.infer<typeof sAnalyticsEvent>;

export const sEventBatch = z.array(sAnalyticsEvent).min(1).max(25);
