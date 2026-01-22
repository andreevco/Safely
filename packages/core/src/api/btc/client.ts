import Big from 'big.js';
import { z } from 'zod';

import { AddressSchema, APIErrorSchema, GasPriceSchema, UtxoSchema } from './models';
import { BtcWalletType } from '../../entities/blockchain/btc';
import { IIdentifiable } from '../../utils/types';

export interface GetAddressParams {
    details?: 'basic' | 'tokens' | 'tokenBalances' | 'txids' | 'txslight' | 'txs';
    tokens?: 'derived' | 'used' | 'nonzero';
    pageSize?: number;
    page?: number;
    from?: number;
    to?: number;
    contractFilter?: string;
    secondaryCurrency?: string;
    gap?: number;
}

export interface BtcDescriptor {
    type: BtcWalletType;
    xpub: string;
    derivationPath?: {
        change: number;
        addressIndex: number | '*';
    };
}

export class BtcApiError extends Error {
    public readonly name = 'BtcApiError';

    public readonly status: number;

    public readonly payload?: unknown;

    constructor(message: string, status: number, payload?: unknown) {
        super(message);
        this.status = status;
        this.payload = payload;
    }
}

const btcWalletTypeToDescriptor: Record<BtcWalletType, 'wpkh' | 'pkh' | 'tr' | 'sh-wpkh'> = {
    [BtcWalletType.NATIVE_SEGWIT]: 'wpkh'
};

export class BtcApi implements IIdentifiable {
    private readonly baseUrl: string;
    private readonly headers: Record<string, string>;
    private readonly timeoutMs = 5000;

    public readonly id: string;

    constructor(options: { baseUrl: string }) {
        this.baseUrl = options.baseUrl.replace(/\/$/, '');
        this.headers = {};
        this.id = `${this.constructor.name}:${this.baseUrl}`;
    }

    public async getXpub(descriptor: BtcDescriptor, params?: GetAddressParams) {
        const serialized = this.serializeDescriptor(descriptor);
        return await this.getJson(`/api/v2/xpub/${serialized}`, AddressSchema, params);
    }

    public async getAccountUtxo(descriptor: BtcDescriptor) {
        const serialized = this.serializeDescriptor(descriptor);
        return await this.getJson(`/api/v2/utxo/${serialized}`, z.array(UtxoSchema));
    }

    /**
     * float sat/vByte
     */
    public async getFeePrice() {
        const parsed = await this.getJson('/api/gasprice', GasPriceSchema);
        const keys = Object.keys(parsed)
            .map(Number)
            .filter(isFinite)
            .filter(k => k >= 0);

        if (keys.length === 0) {
            throw new Error('Cannot fetch gasprice');
        }

        const minKey = Math.min(...keys);
        return new Big(parsed[minKey]);
    }

    public async sendTransaction(hex: string): Promise<{ txid: string }> {
        const res = await this.postPlain('/api/v2/sendtx/', hex, z.object({ result: z.string() }));
        return { txid: res.result };
    }

    private serializeDescriptor(descriptor: BtcDescriptor): string {
        let path = `${btcWalletTypeToDescriptor[descriptor.type]}(${descriptor.xpub}`;
        if (descriptor.derivationPath) {
            path += `/${descriptor.derivationPath?.change ?? 0}/${descriptor.derivationPath?.addressIndex ?? '*'}`;
        }

        return path + ')';
    }

    private async getJson<T extends z.ZodTypeAny, Q extends object>(
        path: string,
        schema: T,
        query?: Q
    ): Promise<z.infer<T>> {
        const url = this.buildUrl(path, query);
        const response = await this.performFetch(url, { method: 'GET' });
        return await this.parseAndValidate(response, schema);
    }

    private async postPlain<T extends z.ZodTypeAny>(
        path: string,
        body: string,
        schema: T
    ): Promise<z.infer<T>> {
        const url = this.buildUrl(path);
        const response = await this.performFetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            body
        });
        return await this.parseAndValidate(response, schema);
    }

    private buildUrl(path: string, query?: object): string {
        const url = new URL(this.baseUrl + path);
        if (query) {
            Object.entries(query)
                .filter(([, v]) => v !== undefined && v !== null)
                .forEach(([k, v]) => {
                    if (Array.isArray(v)) {
                        url.searchParams.set(k, v.join(','));
                    } else {
                        url.searchParams.set(k, String(v));
                    }
                });
        }
        return url.toString();
    }

    private async performFetch(url: string, init: RequestInit): Promise<Response> {
        const controller = this.timeoutMs ? new AbortController() : undefined;
        const id = this.timeoutMs
            ? setTimeout(() => controller!.abort(), this.timeoutMs)
            : undefined;
        try {
            const mergedInit: RequestInit = {
                ...init,
                headers: { ...this.headers, ...(init.headers || {}) },
                signal: controller?.signal
            };
            return await fetch(url, mergedInit);
        } catch (err) {
            if (err instanceof Error && err.name === 'AbortError') {
                throw new BtcApiError('Request timed out', 408);
            }
            throw err;
        } finally {
            if (id) clearTimeout(id);
        }
    }

    private async parseAndValidate<T extends z.ZodTypeAny>(
        response: Response,
        schema: T
    ): Promise<z.infer<T>> {
        const text = await response.text();
        let parsed: unknown;

        try {
            parsed = text ? JSON.parse(text) : {};
        } catch {
            parsed = text;
        }

        if (!response.ok) {
            const errorResult = APIErrorSchema.safeParse(parsed);
            const message = errorResult.success
                ? errorResult.data.Text
                : response.statusText || 'Request failed';
            throw new BtcApiError(message, response.status, parsed);
        }

        const result = schema.safeParse(parsed);
        if (!result.success) {
            throw new BtcApiError(
                `Response validation failed: ${result.error.message}`,
                response.status,
                parsed
            );
        }

        return result.data;
    }
}
