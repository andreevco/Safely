import { Skia, type SkPath } from '@shopify/react-native-skia';

type ChartPoint = {
    x: number;
    y: number;
    timestamp: number;
};

const MAX_POINTS = 200;

const normalizePoints = (points: ChartPoint[]): ChartPoint[] => {
    if (points.length <= MAX_POINTS) {
        return points;
    }

    const lastIndex = points.length - 1;
    const step = lastIndex / (MAX_POINTS - 1);

    return Array.from({ length: MAX_POINTS }, (_, index) => {
        const pointIndex = Math.round(index * step);

        return points[pointIndex];
    });
};

export const buildChartPoints = (
    width: number,
    height: number,
    prices: [number, number][],
    xAxisRange?: {
        startTimestamp: number;
        endTimestamp: number;
    }
): ChartPoint[] => {
    const points = normalizePoints(
        prices.map(([timestamp, price]) => ({ x: timestamp, y: price, timestamp }))
    );

    const count = points.length;
    if (count === 0) {
        return [];
    }

    const yValues = points.map(point => point.y);

    const min = Math.min(...yValues);
    const max = Math.max(...yValues);
    const range = max - min || 1;

    const toMilliseconds = (timestamp: number) => {
        // API may return unix seconds while axis timestamps are in milliseconds.
        return timestamp < 1e12 ? timestamp * 1000 : timestamp;
    };

    const timestamps = points.map(point => toMilliseconds(point.timestamp));
    const startTimestamp = xAxisRange ? xAxisRange.startTimestamp : Math.min(...timestamps);
    const endTimestamp = xAxisRange ? xAxisRange.endTimestamp : Math.max(...timestamps);
    const timeRange = endTimestamp - startTimestamp || 1;

    return points.map((value, index) => {
        const normalized = (value.y - min) / range;
        const clamped = Math.max(0, Math.min(1, normalized));
        const timestamp = timestamps[index];
        const normalizedX = (timestamp - startTimestamp) / timeRange;
        const clampedX = Math.max(0, Math.min(1, normalizedX));

        return {
            x: clampedX * width,
            y: height - clamped * (height - 12),
            timestamp
        };
    });
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
