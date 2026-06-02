export class ApiError extends Error {
    public readonly name: string = 'ApiError';

    public readonly status: number;

    public readonly payload?: unknown;

    public readonly code?: number;

    constructor(message: string, status: number, payload?: unknown, code?: number) {
        super(message);
        this.status = status;
        this.payload = payload;
        this.code = code;
    }
}
