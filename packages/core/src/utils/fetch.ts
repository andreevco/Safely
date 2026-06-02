import type { z } from 'zod';

import type { ApiError } from './api-error';
import { BtcApiError } from '../api/btc/errors';
import { APIErrorSchema } from '../api/btc/models';

export type AuthorizationProvider = (req: {
    method: string;
    pathWithQuery: string;
    bodyBytes: Uint8Array;
}) => string | Promise<string>;

export class ApiClient {
    protected readonly headers: Record<string, string>;

    protected readonly timeoutMs = 5000;

    constructor(
        protected readonly baseUrl: string,
        headers: Record<string, string> = {},
        protected readonly getAuthorization?: AuthorizationProvider
    ) {
        this.headers = { ...headers };
    }

    protected async getJson<T extends z.ZodTypeAny, Q extends object>(
        path: string,
        schema: T,
        query?: Q,
        opts?: { authorized?: boolean }
    ): Promise<z.infer<T>> {
        const { absoluteUrl, pathWithQuery } = this.buildRequestTarget(path, query);
        const authHeaders = await this.authHeaders('GET', pathWithQuery, new Uint8Array(), opts);
        const response = await this.performFetch(absoluteUrl, {
            method: 'GET',
            headers: authHeaders
        });
        return await this.parseAndValidate(response, schema);
    }

    protected async postPlain<T extends z.ZodTypeAny>(
        path: string,
        body: string,
        schema: T
    ): Promise<z.infer<T>> {
        const { absoluteUrl } = this.buildRequestTarget(path);
        const response = await this.performFetch(absoluteUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            body
        });
        return await this.parseAndValidate(response, schema);
    }

    protected async postJson(path: string, body: unknown): Promise<void>;
    protected async postJson<T extends z.ZodTypeAny>(
        path: string,
        body: unknown,
        schema: T,
        query?: object,
        opts?: { authorized?: boolean }
    ): Promise<z.infer<T>>;
    protected async postJson<T extends z.ZodTypeAny>(
        path: string,
        body: unknown,
        schema?: T,
        query?: object,
        opts?: { authorized?: boolean }
    ): Promise<z.infer<T> | void> {
        const { absoluteUrl, pathWithQuery } = this.buildRequestTarget(path, query);
        const authHeaders = await this.authHeaders('POST', pathWithQuery, body, opts);

        const response = await this.performFetch(absoluteUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', ...authHeaders },
            body: JSON.stringify(body)
        });

        if (!schema) {
            if (!response.ok) await this.parseAndThrow(response);

            return;
        }

        return await this.parseAndValidate(response, schema);
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

    private buildRequestTarget(
        path: string,
        query?: object
    ): { absoluteUrl: string; pathWithQuery: string } {
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
        return { absoluteUrl: url.toString(), pathWithQuery: url.pathname + url.search };
    }

    private async authHeaders(
        method: string,
        pathWithQuery: string,
        body: unknown,
        opts?: { authorized?: boolean }
    ): Promise<Record<string, string>> {
        if (!opts?.authorized) return {};
        if (!this.getAuthorization) {
            throw new Error('ApiClient: an authorized request was made without getAuthorization');
        }
        const bodyBytes =
            body !== undefined ? new TextEncoder().encode(JSON.stringify(body)) : new Uint8Array();
        const authorization = await this.getAuthorization({ method, pathWithQuery, bodyBytes });
        return { Authorization: authorization };
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
            throw this.createError(response, parsed);
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

    private async parseAndThrow(response: Response): Promise<never> {
        const text = await response.text();
        let parsed: unknown;

        try {
            parsed = text ? JSON.parse(text) : {};
        } catch {
            parsed = text;
        }

        throw this.createError(response, parsed);
    }

    protected createError(response: Response, parsed: unknown): ApiError {
        const errorResult = APIErrorSchema.safeParse(parsed);
        const message = errorResult.success
            ? errorResult.data.error
            : response.statusText || 'Request failed';
        return new BtcApiError(message, response.status, parsed);
    }
}
