import { useMemo } from 'react';
import { type SharedValue } from 'react-native-reanimated';

import { buildChartPath, buildChartPoints, type ChartPoint } from '@mobile/shared/utils/chart';

import { CHART_CONFIG, ChartPeriod } from '../config';

type UseChartPathsParams = {
    prices: [number, number][];
    width: number;
    height: number;
    startDate: number;
    selectedPeriod: ChartPeriod;
    chartPointsShared: SharedValue<ChartPoint[]>;
    pathFractionsShared: SharedValue<number[]>;
};

const computePathFractions = (points: ChartPoint[]): number[] => {
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

export const useChartPaths = (params: UseChartPathsParams) => {
    const {
        prices,
        width,
        height,
        startDate,
        selectedPeriod,
        chartPointsShared,
        pathFractionsShared
    } = params;

    return useMemo(() => {
        const intermediatePoints =
            CHART_CONFIG[selectedPeriod].getPeriodIntermediatePoints(startDate);

        const chart = buildChartPoints(width, height, prices, {
            startTimestamp: intermediatePoints[0],
            endTimestamp: intermediatePoints[intermediatePoints.length - 1]
        });

        chartPointsShared.value = chart.points;

        const fullPath = buildChartPath(chart.points);
        const fractions = computePathFractions(chart.points);
        pathFractionsShared.value = fractions;

        const splitPoint = Date.now() - CHART_CONFIG[selectedPeriod].fullPeriodLength;
        const splitIndex = chart.points.findIndex(point => point.timestamp >= splitPoint);

        const last = chart.points[chart.points.length - 1];
        const periodSplitEnd = splitIndex > 0 ? (fractions[splitIndex] ?? 0) : 0;

        return {
            fullPath,
            elegantPrices: chart.elegantPrices,
            periodSplitEnd,
            lastPoint: last ? { x: last.x, y: last.y } : null
        };
    }, [prices, height, width, startDate, selectedPeriod, chartPointsShared, pathFractionsShared]);
};
