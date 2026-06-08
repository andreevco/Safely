import { ApiError } from '../../utils/fetch';

export class BtcApiError extends ApiError {
    public override readonly name = 'BtcApiError';
}