import { ApiError } from '../../utils/api-error';

export class BtcApiError extends ApiError {
    public readonly name = 'BtcApiError';

    constructor(message: string, status: number, payload?: unknown) {
        super(message, status, payload);
    }
}
