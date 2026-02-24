import {
    CurrentPrice,
    CurrentPriceSchema,
    GetCurrentPriceParams,
    HistoricalPrice,
    HistoricalPriceSchema,
    GetHistoricalPriceParams
} from './models';
import { IIdentifiable } from '../../utils';
import { ApiClient } from '../../utils/fetch';

export class PriceApi extends ApiClient implements IIdentifiable {
    public readonly id: string;

    constructor(options: { baseUrl: string }) {
        const baseUrl = options.baseUrl.replace(/\/$/, '');
        super(baseUrl);

        this.id = `${this.constructor.name}:${baseUrl}`;
    }

    public async getCurrentPrice(params: GetCurrentPriceParams): Promise<CurrentPrice> {
        return this.getJson('/v1/prices/current', CurrentPriceSchema, params);
    }

    public async getHistoricalPrice(params: GetHistoricalPriceParams): Promise<HistoricalPrice> {
        return this.getJson('/v1/prices/chart', HistoricalPriceSchema, params);
    }
}
