import { describe, expect, it, vi } from 'vitest';

vi.mock('@shopify/react-native-skia', () => ({
    Skia: {
        PathBuilder: {
            Make: () => ({ moveTo() {}, lineTo() {}, build: () => ({}) })
        }
    }
}));

import { buildChartPoints, formatCompactPrice } from '@mobile/shared/utils/chart';

const WIDTH = 200;
const HEIGHT = 100;

const T0 = 1_700_000_000_000;
const T1 = T0 + 1000;
const T2 = T0 + 2000;

const allFinite = (nums: number[]) => nums.every(Number.isFinite);
const isAscending = (nums: number[]) => nums.every((n, i) => i === 0 || n > nums[i - 1]);

describe('buildChartPoints', () => {
    it('returns no points for an empty series', () => {
        const result = buildChartPoints(WIDTH, HEIGHT, []);

        expect(result.points).toEqual([]);
        expect(result.elegantPrices).toBeUndefined();
    });

    it('handles a single price point without hanging', () => {
        const { points, elegantPrices } = buildChartPoints(WIDTH, HEIGHT, [[1781495940, 65861.46]]);

        expect(points).toHaveLength(1);
        expect(points[0].price).toBe(65861.46);
        expect(allFinite([points[0].x, points[0].y])).toBe(true);

        expect(elegantPrices).toHaveLength(4);
        const labels = elegantPrices!.map(p => p.price);
        expect(allFinite([...labels, ...elegantPrices!.map(p => p.y)])).toBe(true);
        expect(isAscending(labels)).toBe(true);
        expect(labels[0]).toBeLessThanOrEqual(65861.46);
        expect(labels[labels.length - 1]).toBeGreaterThanOrEqual(65861.46);
        expect(labels[labels.length - 1] - labels[0]).toBeGreaterThan(65861.46 * 0.001);
    });

    it('handles a flat two-point series (range 0) without hanging', () => {
        const { points, elegantPrices } = buildChartPoints(WIDTH, HEIGHT, [
            [T0, 100],
            [T1, 100]
        ]);

        expect(points).toHaveLength(2);
        expect(points[0].y).toBeCloseTo(points[1].y, 5);
        const labels = elegantPrices!.map(p => p.price);
        expect(isAscending(labels)).toBe(true);
        expect(labels[0]).toBeLessThanOrEqual(100);
        expect(labels[labels.length - 1]).toBeGreaterThanOrEqual(100);
    });

    it('handles near-equal prices at large magnitude without hanging', () => {
        const { points, elegantPrices } = buildChartPoints(WIDTH, HEIGHT, [
            [T0, 1e8],
            [T1, 1e8 + 5e-8]
        ]);

        expect(points).toHaveLength(2);
        expect(allFinite(points.flatMap(p => [p.x, p.y]))).toBe(true);
        const labels = elegantPrices!.map(p => p.price);
        expect(allFinite(labels)).toBe(true);
        expect(isAscending(labels)).toBe(true);
    });

    it('maps a normal series to pixel space', () => {
        const { points, elegantPrices } = buildChartPoints(
            WIDTH,
            HEIGHT,
            [
                [T0, 100],
                [T1, 200],
                [T2, 150]
            ],
            { startTimestamp: T0, endTimestamp: T2 }
        );

        expect(points.map(p => p.price)).toEqual([100, 200, 150]);
        expect(points.map(p => p.timestamp)).toEqual([T0, T1, T2]);

        expect(points.map(p => p.x)).toEqual([0, WIDTH / 2, WIDTH]);

        expect(allFinite(points.map(p => p.y))).toBe(true);
        expect(points.every(p => p.y >= 0 && p.y <= HEIGHT)).toBe(true);
        expect(points[1].y).toBeCloseTo(HEIGHT * 0.15, 5);
        expect(points[0].y).toBeGreaterThan(points[2].y);
        expect(points[2].y).toBeGreaterThan(points[1].y);

        const labels = elegantPrices!.map(p => p.price);
        expect(labels).toHaveLength(4);
        expect(isAscending(labels)).toBe(true);
        expect(labels[0]).toBeLessThanOrEqual(100);
        expect(labels[labels.length - 1]).toBeGreaterThanOrEqual(200);
    });

    it('converts unix-second timestamps to milliseconds', () => {
        const { points } = buildChartPoints(WIDTH, HEIGHT, [
            [1_700_000_000, 100],
            [1_700_000_002, 200]
        ]);

        expect(points[0].timestamp).toBe(1_700_000_000_000);
        expect(points[1].timestamp).toBe(1_700_000_002_000);
    });
});

describe('formatCompactPrice', () => {
    const T = '\u2009';

    it('formats thousands with a K suffix', () => {
        expect(formatCompactPrice(2_000)).toBe(`2${T}K`);
        expect(formatCompactPrice(999_999)).toBe(`999.999${T}K`);
    });

    it('formats millions with an M suffix', () => {
        expect(formatCompactPrice(1_000_000)).toBe(`1${T}M`);
        expect(formatCompactPrice(1_500_000)).toBe(`1.5${T}M`);
    });

    it('formats billions with a B suffix', () => {
        expect(formatCompactPrice(1_000_000_000)).toBe(`1${T}B`);
        expect(formatCompactPrice(3_000_000_000)).toBe(`3${T}B`);
    });

    it('keeps the sign for negative values', () => {
        expect(formatCompactPrice(-2_000_000)).toBe(`-2${T}M`);
    });
});
