import type { RateApi } from '../api/rate/client';

export class RateCache {
    private readonly cache = new Map<string, Promise<number>>();

    constructor(private readonly rateApi: Pick<RateApi, 'getRate'>) {}

    public get(currency: string): Promise<number> {
        if (currency === 'USD') return Promise.resolve(1);

        const cached = this.cache.get(currency);
        if (cached) return cached;

        const promise = this.rateApi.getRate({ currency }).then(r => r.rate);
        this.cache.set(currency, promise);

        return promise;
    }
}
