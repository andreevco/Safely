import { BtcSendDustError } from '../../blockchain-api';
import { OutputsAreSpendingMoreThanInputsError } from '../../entities';
import { ApiError } from '../../utils/fetch';

export function classifyAnalyticsSendError(error: unknown): string {
    if (error instanceof BtcSendDustError) return 'dust';
    if (error instanceof OutputsAreSpendingMoreThanInputsError) return 'insufficient_funds';
    if (error instanceof ApiError) {
        if (error.status === 408) return 'timeout';
        if (error.status === null) return 'no_internet_connection';
    }

    return 'unknown';
}
