import { Skia, type SkPath } from '@shopify/react-native-skia';

export function formatCompactPrice(value: number): string {
    const abs = Math.abs(value);
    if (abs >= 1e9) return `${value / 1e9} B`;
    if (abs >= 1e6) return `${value / 1e6} M`;
    return `${value / 1e3} K`;
}

const NICE_MULTIPLIERS = [1, 2, 2.5, 5, 10];

function niceStepsAround(x: number): number[] {
    if (x <= 0) return [1];

    const k = Math.floor(Math.log10(x));
    const bases = [10 ** (k - 1), 10 ** k, 10 ** (k + 1)];

    const steps = bases.flatMap(b => NICE_MULTIPLIERS.map(m => m * b));
    return [...new Set(steps)].sort((a, b) => a - b);
}

function thirdIndex(value: number, axisMin: number, step: number): number {
    if (value <= axisMin + step) return 0;
    if (value <= axisMin + 2 * step) return 1;
    return 2;
}

function scoreAxis(minVal: number, maxVal: number, axisMin: number, step: number): number {
    const axisMax = axisMin + 3 * step;
    if (minVal < axisMin || maxVal > axisMax) return Infinity;

    const minThird = thirdIndex(minVal, axisMin, step);
    const maxThird = thirdIndex(maxVal, axisMin, step);

    const dataCenter = (minVal + maxVal) / 2;
    const axisCenter = axisMin + 1.5 * step;
    const balancePenalty = Math.abs(dataCenter - axisCenter) / step;

    const wastedSpace = axisMax - axisMin - (maxVal - minVal);
    const wastePenalty = wastedSpace / step;

    const sameThirdPenalty = minThird === maxThird ? 2 : 0;

    return sameThirdPenalty + balancePenalty + 0.2 * wastePenalty;
}

// Reference: https://andreev-co.slack.com/archives/C0A8LP6SZ5K/p1773311124207309
function elegantScale(minVal: number, maxVal: number): [number, number, number, number] {
    if (minVal > maxVal) [minVal, maxVal] = [maxVal, minVal];

    const range = maxVal - minVal;
    const rawStep = Math.max(range / 3, 1e-12);
    const candidateSteps = niceStepsAround(rawStep).filter(s => s >= rawStep / 2);

    let bestScore = Infinity;
    let bestAxisMin = 0;
    let bestStep = rawStep;

    for (const step of candidateSteps) {
        const kMin = Math.floor((maxVal - 3 * step) / step);
        const kMax = Math.floor(minVal / step);
        const kStart = minVal >= 0 ? Math.max(kMin, 0) : kMin;

        for (let k = kStart; k <= kMax; k++) {
            const axisMin = k * step;
            const score = scoreAxis(minVal, maxVal, axisMin, step);

            if (score < bestScore) {
                bestScore = score;
                bestAxisMin = axisMin;
                bestStep = step;
            }
        }
    }

    return [
        bestAxisMin,
        bestAxisMin + bestStep,
        bestAxisMin + 2 * bestStep,
        bestAxisMin + 3 * bestStep
    ];
}

export type ChartPoint = {
    x: number;
    y: number;
    timestamp: number;
    price: number;
};

export const buildChartPoints = (
    width: number,
    height: number,
    prices: [number, number][],
    xAxisRange?: {
        startTimestamp: number;
        endTimestamp: number;
    }
): {
    elegantPrices?: { price: number; y: number; shouldBeRendered: boolean }[];
    points: ChartPoint[];
} => {
    const points = prices.map(([timestamp, price]) => ({
        x: timestamp,
        y: price,
        timestamp,
        price
    }));

    const count = points.length;
    if (count === 0) {
        return { points: [] };
    }

    const yValues = points.map(point => point.y);

    const min = Math.min(...yValues);
    const max = Math.max(...yValues);

    const scale = elegantScale(min, max);
    const scaleMin = scale[0];
    const range = scale[3] - scale[0] || 1;

    const toMilliseconds = (timestamp: number) => {
        // API may return unix seconds while axis timestamps are in milliseconds.
        return timestamp < 1e12 ? timestamp * 1000 : timestamp;
    };

    const timestamps = points.map(point => toMilliseconds(point.timestamp));
    const startTimestamp = xAxisRange ? xAxisRange.startTimestamp : Math.min(...timestamps);
    const endTimestamp = xAxisRange ? xAxisRange.endTimestamp : Math.max(...timestamps);
    const timeRange = endTimestamp - startTimestamp || 1;

    const mappedPoints = points.map((value, index) => {
        const normalized = (value.y - scaleMin) / range;
        const clamped = Math.max(0, Math.min(1, normalized));
        const timestamp = timestamps[index];
        const normalizedX = (timestamp - startTimestamp) / timeRange;

        return {
            x: normalizedX * width,
            y: height - clamped * height,
            timestamp,
            price: value.price
        };
    });

    const elegantPrices = scale.map(price => {
        const normalized = (price - scaleMin) / range;
        const clamped = Math.max(0, Math.min(1, normalized));
        const y = height - clamped * height;

        const shouldBeRendered = !mappedPoints.some(
            point => point.x > width - 32 && Math.abs(point.y - y) < 2
        );

        return {
            price,
            y,
            shouldBeRendered
        };
    });

    return {
        elegantPrices,
        points: mappedPoints
    };
};

export const buildChartPath = (points: ChartPoint[]): SkPath => {
    const path = Skia.Path.Make();
    points.forEach((value, index) => {
        if (index === 0) {
            path.moveTo(value.x, value.y);
        } else {
            path.lineTo(value.x, value.y);
        }
    });

    return path;
};
