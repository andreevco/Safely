import type { ChartPoint } from '@mobile/shared/utils/chart';

export const computePathFractions = (points: ChartPoint[]): number[] => {
    if (points.length === 0) return [];

    const fractions: number[] = [0];
    let cumulative = 0;

    for (let i = 1; i < points.length; i++) {
        const dx = points[i].x - points[i - 1].x;
        const dy = points[i].y - points[i - 1].y;
        cumulative += Math.sqrt(dx * dx + dy * dy);
        fractions.push(cumulative);
    }

    if (cumulative > 0) {
        for (let i = 1; i < fractions.length; i++) {
            fractions[i] /= cumulative;
        }
    }

    return fractions;
};

export type PeriodSplit = {
    splitIndex: number;
    periodSplitEnd: number;
    splitPoint: ChartPoint | undefined;
};

export const computePeriodSplit = (
    points: ChartPoint[],
    splitTimestamp: number,
    fractions: number[]
): PeriodSplit => {
    const splitIndex = points.findIndex(point => point.timestamp >= splitTimestamp);
    const periodSplitEnd = splitIndex > 0 ? (fractions[splitIndex] ?? 0) : 0;
    const splitPoint = splitIndex >= 0 ? points[splitIndex] : undefined;

    return { splitIndex, periodSplitEnd, splitPoint };
};
