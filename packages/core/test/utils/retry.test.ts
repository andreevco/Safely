import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { asyncRetry } from '../../src/utils/retry';

describe('asyncRetry', () => {
    beforeEach(() => {
        vi.useFakeTimers();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('returns result on first success without retries', async () => {
        const fn = vi.fn().mockResolvedValue('ok');
        const wrapped = asyncRetry(fn, { maxAttempts: 3, backoff: 'fixed', baseWait: 1000 });

        await expect(wrapped(1, 2)).resolves.toBe('ok');
        expect(fn).toHaveBeenCalledTimes(1);
        expect(fn).toHaveBeenCalledWith(1, 2);
    });

    it('retries failed attempts up to maxAttempts and throws the last error', async () => {
        const fn = vi.fn().mockRejectedValue(new Error('boom'));
        const wrapped = asyncRetry(fn, { maxAttempts: 3, baseWait: 1000 });

        const assertion = expect(wrapped()).rejects.toThrow('boom');
        await vi.advanceTimersByTimeAsync(2000);
        await assertion;
        expect(fn).toHaveBeenCalledTimes(3);
    });

    it('succeeds when a retry succeeds', async () => {
        const fn = vi.fn().mockRejectedValueOnce(new Error('boom')).mockResolvedValue('ok');
        const wrapped = asyncRetry(fn, { baseWait: 500 });

        const promise = wrapped();
        await vi.advanceTimersByTimeAsync(500);
        await expect(promise).resolves.toBe('ok');
        expect(fn).toHaveBeenCalledTimes(2);
    });

    it('waits baseWait between attempts', async () => {
        const fn = vi.fn().mockRejectedValueOnce(new Error('boom')).mockResolvedValue('ok');
        const wrapped = asyncRetry(fn, { baseWait: 1000 });

        const promise = wrapped();
        await vi.advanceTimersByTimeAsync(999);
        expect(fn).toHaveBeenCalledTimes(1);

        await vi.advanceTimersByTimeAsync(1);
        await expect(promise).resolves.toBe('ok');
        expect(fn).toHaveBeenCalledTimes(2);
    });

    it('rethrows immediately when shouldRetry returns false', async () => {
        const fn = vi.fn().mockRejectedValue(new Error('fatal'));
        const wrapped = asyncRetry(fn, { maxAttempts: 3, shouldRetry: () => false });

        await expect(wrapped()).rejects.toThrow('fatal');
        expect(fn).toHaveBeenCalledTimes(1);
    });
});
