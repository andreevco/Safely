import { ExchangeApiError } from './errors';
import {
    exchangeErrorSchema,
    onrampWidgetResponseSchema,
    providersSchema,
    rampOrdersSchema,
    type GetProvidersParams,
    type GetRampOrdersParams,
    type OnrampWidgetRequest,
    type OnrampWidgetResponse,
    type PostOnrampWidgetParams,
    type Providers,
    type RampOrders
} from './models';
import type { ApiError } from '../../utils/api-error';
import { ApiClient, type AuthorizationProvider } from '../../utils/fetch';
import type { IIdentifiable } from '../../utils/types';

export class ExchangeApi extends ApiClient implements IIdentifiable {
    public readonly id: string;

    constructor(options: { baseUrl: string; getAuthorization?: AuthorizationProvider }) {
        const baseUrl = options.baseUrl.replace(/\/$/, '');
        super(baseUrl, {}, options.getAuthorization);

        this.id = `${this.constructor.name}:${baseUrl}`;
    }

    public async getProviders(params: GetProvidersParams): Promise<Providers> {
        return this.getJson('/v1/providers', providersSchema, this.toProvidersQuery(params));
    }

    public async postOnrampWidget(
        params: PostOnrampWidgetParams,
        body: OnrampWidgetRequest
    ): Promise<OnrampWidgetResponse> {
        return this.postJson(
            '/v1/onramp/widget',
            body,
            onrampWidgetResponseSchema,
            this.toProvidersQuery(params),
            { authorized: true }
        );
    }

    public async getRampOrders(params: GetRampOrdersParams): Promise<RampOrders> {
        return this.getJson('/v1/ramp/orders', rampOrdersSchema, this.toOrdersQuery(params), {
            authorized: true
        });
    }

    protected createError(response: Response, parsed: unknown): ApiError {
        const result = exchangeErrorSchema.safeParse(parsed);
        const code = result.success ? result.data.code : undefined;
        const message =
            code !== undefined
                ? `Exchange API error (code=${code})`
                : response.statusText || 'Request failed';
        return new ExchangeApiError(message, response.status, parsed, code);
    }

    private toProvidersQuery(params: GetProvidersParams) {
        return {
            lang: params.lang,
            fiat: params.fiat,
            store_country_code: params.storeCountryCode,
            device_country_code: params.deviceCountryCode
        };
    }

    private toOrdersQuery(params: GetRampOrdersParams) {
        return {
            lang: params.lang,
            blockchain: params.blockchain,
            store_country_code: params.storeCountryCode,
            device_country_code: params.deviceCountryCode,
            limit: params.limit,
            before: params.before
        };
    }
}
