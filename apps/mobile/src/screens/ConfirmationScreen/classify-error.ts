import { BtcApiError, BtcSendDustError, OutputsAreSpendingMoreThanInputsError } from '@safely/core';

export function classifyError(error: unknown): string {
    if (error instanceof BtcSendDustError) return 'dust';
    if (error instanceof OutputsAreSpendingMoreThanInputsError) return 'insufficient_funds';
    if (error instanceof BtcApiError) {
        if (error.status === 408) return 'timeout';
        if (error.status === null) return 'no_internet_connection';
    }

    return 'unknown';
}
