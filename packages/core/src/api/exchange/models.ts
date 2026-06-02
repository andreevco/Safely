import { z } from 'zod';

export const providerSchema = z.object({
    info: z.object({
        id: z.string(),
        name: z.string(),
        description: z.string(),
        logo: z.string(),
        legal: z.object({ tos: z.string(), privacy: z.string() }),
        support: z.object({ email: z.string(), url: z.string() })
    }),
    likelyUnavailable: z.boolean(),
    onramp: z
        .object({
            fiat: z.object({
                display: z.object({
                    code: z.string(),
                    paymentOptions: z.array(
                        z.object({
                            method: z.enum(['card', 'google_pay', 'apple_pay', 'revolut_pay']),
                            min: z.string(),
                            max: z.string()
                        })
                    )
                })
            }),
            crypto: z.object({
                tokens: z.array(z.object({ blockchain: z.string(), token: z.string() }))
            })
        })
        .optional()
});
export type Provider = z.infer<typeof providerSchema>;

export const providersSchema = z.object({ providers: z.array(providerSchema) });
export type Providers = z.infer<typeof providersSchema>;

export const rampOrderSchema = z.object({
    id: z.string(),
    type: z.enum(['onramp', 'offramp']),
    provider: z.string(),
    status: z.enum([
        'new',
        'pending',
        'processing',
        'completed',
        'failed',
        'expired',
        'mismatched'
    ]),
    createdAt: z.number(),
    updatedAt: z.number(),
    fiatAmount: z.string(),
    fiatCurrency: z.string(),
    cryptoAmount: z.string(),
    blockchain: z.string(),
    token: z.string(),
    supportDetails: z.string(),
    txHash: z.string().optional()
});
export type RampOrder = z.infer<typeof rampOrderSchema>;

export const rampOrdersSchema = z.object({
    orders: z.array(rampOrderSchema),
    cursor: z.string().optional()
});
export type RampOrders = z.infer<typeof rampOrdersSchema>;

export const onrampWidgetRequestSchema = z.object({
    provider: z.string(),
    blockchain: z.string(),
    token: z.string(),
    address: z.string()
});
export type OnrampWidgetRequest = z.infer<typeof onrampWidgetRequestSchema>;

export const onrampWidgetResponseSchema = z.object({ widgetUrl: z.string() });
export type OnrampWidgetResponse = z.infer<typeof onrampWidgetResponseSchema>;

export const exchangeErrorSchema = z.object({ code: z.number() });
export type ExchangeError = z.infer<typeof exchangeErrorSchema>;

export interface BaseParams {
    lang: string;
    storeCountryCode?: string;
    deviceCountryCode?: string;
}

export interface GetProvidersParams extends BaseParams {
    fiat: string;
}

export interface PostOnrampWidgetParams extends BaseParams {
    fiat: string;
}

export interface GetRampOrdersParams extends BaseParams {
    blockchain: string;
    limit?: number;
    before?: string;
}
