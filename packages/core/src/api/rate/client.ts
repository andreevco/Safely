import type { GetRateParams, RateResponse } from './models';
import { RateSchema } from './models';
import type { IIdentifiable } from '../../utils';
import { ApiClient } from '../../utils/fetch';

export class RateApi extends ApiClient implements IIdentifiable {
    public readonly id: string;

    constructor(options: { baseUrl: string }) {
        const baseUrl = options.baseUrl.replace(/\/$/, '');
        super(baseUrl);

        this.id = `${this.constructor.name}:${baseUrl}`;
    }

    public async getRate(params: GetRateParams): Promise<RateResponse> {
        return this.getJson('/v1/rate', RateSchema, params);
    }
}
