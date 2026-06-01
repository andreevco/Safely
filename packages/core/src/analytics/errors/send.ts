import { BtcApiError } from '../../api/btc';
import { BtcSendDustError } from '../../blockchain-api';
import { OutputsAreSpendingMoreThanInputsError } from '../../entities';

export function classifyAnalyticsSendError(error: unknown): string {
    if (error instanceof BtcSendDustError) return 'dust';
    if (error instanceof OutputsAreSpendingMoreThanInputsError) return 'insufficient_funds';
    if (error instanceof BtcApiError) {
        if (error.status === 408) return 'timeout';
        if (error.status === null) return 'no_internet_connection';
    }

    return 'unknown';
}
