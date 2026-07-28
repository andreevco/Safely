import { describe, expect, it } from 'vitest';

import { getReconnectDelayMs } from '../../src/sync-machine/reconnect-backoff';

describe('sync machine reconnect backoff', () => {
    it('grows exponentially up to 30 seconds', () => {
        const withoutJitter = () => 0.5;

        expect(getReconnectDelayMs(1, withoutJitter)).toBe(1000);
        expect(getReconnectDelayMs(2, withoutJitter)).toBe(2000);
        expect(getReconnectDelayMs(3, withoutJitter)).toBe(4000);
        expect(getReconnectDelayMs(4, withoutJitter)).toBe(8000);
        expect(getReconnectDelayMs(5, withoutJitter)).toBe(16_000);
        expect(getReconnectDelayMs(6, withoutJitter)).toBe(30_000);
        expect(getReconnectDelayMs(20, withoutJitter)).toBe(30_000);
    });

    it('applies jitter without exceeding 30 seconds', () => {
        expect(getReconnectDelayMs(3, () => 0)).toBe(3200);
        expect(getReconnectDelayMs(3, () => 1)).toBe(4800);
        expect(getReconnectDelayMs(20, () => 1)).toBe(30_000);
    });
});
