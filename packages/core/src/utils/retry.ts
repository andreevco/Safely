import { delay } from './timers';

export type RetryBackoff = 'fixed';

export interface AsyncRetryOptions {
    maxAttempts?: number;
    backoff?: RetryBackoff;
    baseWait?: number;
    shouldRetry?: (error: unknown, attempt: number) => boolean;
}

export function asyncRetry<Args extends unknown[], Result>(
    fn: (...args: Args) => Promise<Result>,
    options: AsyncRetryOptions = {}
): (...args: Args) => Promise<Result> {
    const { maxAttempts = 3, baseWait = 1000, shouldRetry } = options;

    return async (...args) => {
        for (let attempt = 1; ; attempt++) {
            try {
                return await fn(...args);
            } catch (error) {
                if (attempt >= maxAttempts || (shouldRetry && !shouldRetry(error, attempt))) {
                    throw error;
                }

                await delay(baseWait);
            }
        }
    };
}
