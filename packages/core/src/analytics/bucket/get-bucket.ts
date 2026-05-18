import type { Bucket } from './bucket-types';

export function getBucket(usdAmount: number): Bucket | null {
    if (!Number.isFinite(usdAmount) || usdAmount < 0) return null;

    if (usdAmount <= 0) return 'zero';
    if (usdAmount <= 7.5) return 'dust';
    if (usdAmount <= 75) return 'small';
    if (usdAmount <= 7_500) return 'medium';
    if (usdAmount <= 75_000) return 'high';

    return 'vip';
}
