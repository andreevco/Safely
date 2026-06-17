import { Skia, type SkPath } from '@shopify/react-native-skia';
import { useEffect, useMemo } from 'react';
import type { SharedValue } from 'react-native-reanimated';

import { buildChartPath, buildChartPoints, type ChartPoint } from '@mobile/shared/utils/chart';

import type { ChartPeriod } from '../config';
import { CHART_CONFIG } from '../config';
import { computePathFractions, computePeriodSplit } from '../utils/pathGeometry';

type UseChartPathsParams = {
    prices: [number, number][];
    width: number;
    height: number;
    startDate: number;
    selectedPeriod: ChartPeriod;
    chartPointsShared: SharedValue<ChartPoint[]>;
    pathFractionsShared: SharedValue<number[]>;
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

    const result = useMemo(() => {
        const intermediatePoints =
            CHART_CONFIG[selectedPeriod].getPeriodIntermediatePoints(startDate);

        const chart = buildChartPoints(width, height, prices, {
            startTimestamp: intermediatePoints[0],
            endTimestamp: intermediatePoints[intermediatePoints.length - 1]
        });

        const fullPath = buildChartPath(chart.points);
        const fractions = computePathFractions(chart.points);

        const splitTimestamp = Date.now() - CHART_CONFIG[selectedPeriod].fullPeriodLength;
        const { periodSplitEnd, splitPoint } = computePeriodSplit(
            chart.points,
            splitTimestamp,
            fractions
        );

        const last = chart.points[chart.points.length - 1];

        const mainSplitPath: SkPath =
            periodSplitEnd > 0
                ? (Skia.Path.Trim(fullPath, periodSplitEnd, 1, false) ?? fullPath)
                : fullPath;
        const fadedSplitPath: SkPath | null =
            periodSplitEnd > 0
                ? (Skia.Path.Trim(fullPath, 0, periodSplitEnd, false) ?? null)
                : null;

        return {
            fullPath,
            mainSplitPath,
            fadedSplitPath,
            elegantPrices: chart.elegantPrices,
            splitPoint,
            lastPoint: last ? { x: last.x, y: last.y } : null,
            points: chart.points,
            fractions
        };
    }, [prices, height, width, startDate, selectedPeriod]);

    useEffect(() => {
        chartPointsShared.value = result.points;
        pathFractionsShared.value = result.fractions;
    }, [result, chartPointsShared, pathFractionsShared]);

    return result;
};
