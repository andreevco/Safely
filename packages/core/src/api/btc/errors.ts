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
