import { z } from 'zod';

import { BtcApiError } from '../api/btc/errors';
import { APIErrorSchema } from '../api/btc/models';

export class ApiClient {
    protected readonly headers: Record<string, string> = {};

    protected readonly timeoutMs = 5000;

    constructor(protected readonly baseUrl: string) {}

    protected async getJson<T extends z.ZodTypeAny, Q extends object>(
        path: string,
        schema: T,
        query?: Q
    ): Promise<z.infer<T>> {
        const url = this.buildUrl(path, query);
        const response = await this.performFetch(url, { method: 'GET' });
        return await this.parseAndValidate(response, schema);
    }

    protected async postPlain<T extends z.ZodTypeAny>(
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
