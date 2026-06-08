import { ApiError } from '../../utils/fetch';
export class ExchangeApiError extends ApiError {
    public readonly name = 'ExchangeApiError';
}
