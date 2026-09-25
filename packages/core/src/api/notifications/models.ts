import { z } from 'zod';

import type { Build } from '../../entities/application/build.schema';

export const notificationEventTypeSchema = z.enum(['received', 'sent']);
export type NotificationEventType = z.infer<typeof notificationEventTypeSchema>;

export const subscriptionEntrySchema = z.object({
    type: notificationEventTypeSchema,
    confirmations: z.number().int().min(0).max(12),
    targets: z.array(z.string()).min(1)
});
export type SubscriptionEntry = z.infer<typeof subscriptionEntrySchema>;

export const subscriptionGroupSchema = z.object({
    events: z.array(subscriptionEntrySchema).min(1)
});
export type SubscriptionGroup = z.infer<typeof subscriptionGroupSchema>;

export const targetRefsSchema = z.record(z.string(), z.string());
export type TargetRefs = z.infer<typeof targetRefsSchema>;

export const replaceGroupResponseSchema = z.looseObject({
    target_refs: targetRefsSchema
});

export const generalSubscriptionSchema = z.object({
    news: z.boolean()
});
export type GeneralSubscription = z.infer<typeof generalSubscriptionSchema>;

export type PushDeviceCredentials = {
    pushToken: string;
    platform: Build;
    lang?: string;
    appVersion?: string;
};
