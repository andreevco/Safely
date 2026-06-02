import { ApiError } from '../../utils/api-error';

export class ExchangeApiError extends ApiError {
    public readonly name = 'ExchangeApiError';
}
