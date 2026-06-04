import { z } from 'zod';

export class ApiError extends Error {
    public readonly name: string = 'ApiError';

    public readonly status: number;

    public readonly payload?: unknown;

    constructor(message: string, status: number, payload?: unknown) {
        super(message);
        this.status = status;
        this.payload = payload;
    }
}

/** API error response. */
const APIErrorSchema = z.looseObject({
    error: z.string()
});

export class ApiClient {
    protected readonly headers: Record<string, string>;

    protected readonly timeoutMs: number = 5000;

    /** subclasses override to throw their own ApiError subclass */
    protected readonly errorConstructor: new (
        message: string,
        status: number,
        payload?: unknown
    ) => ApiError = ApiError;

    constructor(
        protected readonly baseUrl: string,
        headers: Record<string, string> = {}
    ) {
        this.headers = { ...headers };
    }

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

    protected async postJson(path: string, body: unknown): Promise<void>;
    protected async postJson<T extends z.ZodTypeAny>(
        path: string,
        body: unknown,
        schema: T
    ): Promise<z.infer<T>>;
    protected async postJson<T extends z.ZodTypeAny>(
        path: string,
        body: unknown,
        schema?: T
    ): Promise<z.infer<T> | void> {
        const url = this.buildUrl(path);
        const response = await this.performFetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });

        if (!schema) {
            if (!response.ok) await this.parseAndThrow(response);

            return;
        }

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
                throw new this.errorConstructor('Request timed out', 408);
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
                ? errorResult.data.error
                : response.statusText || 'Request failed';
            throw new this.errorConstructor(message, response.status, parsed);
        }

        const result = schema.safeParse(parsed);
        if (!result.success) {
            throw new this.errorConstructor(
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

        const errorResult = APIErrorSchema.safeParse(parsed);
        const message = errorResult.success
            ? errorResult.data.error
            : response.statusText || 'Request failed';

        throw new this.errorConstructor(message, response.status, parsed);
    }
}
