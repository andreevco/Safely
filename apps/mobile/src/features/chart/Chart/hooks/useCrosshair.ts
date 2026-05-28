import { selectionAsync } from 'expo-haptics';
import { useCallback, useMemo, useState } from 'react';
import { Gesture, type GestureType } from 'react-native-gesture-handler';
import { type SharedValue, useSharedValue } from 'react-native-reanimated';
import { runOnJS } from 'react-native-worklets';

import { useDateFormatter } from '@safely/ux';

import type { ChartPoint } from '@mobile/shared/utils/chart';

import type { ChartPeriod } from '../config';
import { CHART_CONFIG } from '../config';
import { getPriceDiff, type PriceDiffValue } from '../utils/priceDiff';

const findNearestIndex = (points: ChartPoint[], touchX: number): number => {
    'worklet';
    const len = points.length;
    if (len === 0) return -1;

    let low = 0;
    let high = len - 1;

    while (low < high) {
        const mid = (low + high) >> 1;
        if (points[mid].x < touchX) {
            low = mid + 1;
        } else {
            high = mid;
        }
    }

    if (low > 0 && Math.abs(points[low - 1].x - touchX) < Math.abs(points[low].x - touchX)) {
        return low - 1;
    }

    return low;
};

const getActivePoints = (
    points: ChartPoint[],
    primaryIndex: number,
    secondaryIndex?: number
): ChartPoint[] => {
    'worklet';

    if (primaryIndex === -1) return [];

    const activePoints = [points[primaryIndex]];

    if (secondaryIndex !== undefined && secondaryIndex !== -1) {
        activePoints.push(points[secondaryIndex]);
    }

    return activePoints;
};

export type CrosshairState = {
    isActive: boolean;
    x: number;
    y: number;
    pointIndex: number;
    pathFraction: number;
};

const createInactiveCrosshairState = (): CrosshairState => {
    'worklet';

    return {
        isActive: false,
        x: 0,
        y: 0,
        pointIndex: -1,
        pathFraction: 0
    };
};

const setCrosshairPoint = (
    crosshair: SharedValue<CrosshairState>,
    points: ChartPoint[],
    fractions: number[],
    pointIndex: number
) => {
    'worklet';

    const point = points[pointIndex];
    crosshair.value = {
        isActive: true,
        x: point.x,
        y: point.y,
        pointIndex,
        pathFraction: fractions[pointIndex] ?? 0
    };
};

const clearCrosshair = (crosshair: SharedValue<CrosshairState>) => {
    'worklet';
    crosshair.value = createInactiveCrosshairState();
};

type UseCrosshairParams = {
    chartPointsShared: SharedValue<ChartPoint[]>;
    pathFractionsShared: SharedValue<number[]>;
    selectedPeriod: ChartPeriod;
};

type UseCrosshairResult = {
    primaryCrosshair: SharedValue<CrosshairState>;
    secondaryCrosshair: SharedValue<CrosshairState>;
    isTimeLabelReady: SharedValue<boolean>;
    activePrice: number | undefined;
    activePriceDiff?: PriceDiffValue;
    gesture: GestureType;
    formattedTime: string;
};

export const useCrosshair = (params: UseCrosshairParams): UseCrosshairResult => {
    const { chartPointsShared, pathFractionsShared, selectedPeriod } = params;

    const primaryCrosshair = useSharedValue<CrosshairState>(createInactiveCrosshairState());
    const isTimeLabelReady = useSharedValue(false);
    const secondaryCrosshair = useSharedValue<CrosshairState>(createInactiveCrosshairState());

    const [activePrice, setActivePrice] = useState<number | undefined>(undefined);
    const [activePriceDiff, setActivePriceDiff] = useState<PriceDiffValue>(null);
    const [formattedTime, setFormattedTime] = useState('');
    const dateFormatter = useDateFormatter();

    const onPointsChanged = useCallback(
        (points: ChartPoint[]) => {
            const [point1, point2] = points;

            if (!point1) {
                setActivePrice(undefined);
                setActivePriceDiff(null);
                setFormattedTime('');
                isTimeLabelReady.value = false;
                return;
            }

            void selectionAsync();

            const formatter = dateFormatter(CHART_CONFIG[selectedPeriod].crosshairDateFormat);
            const newerPoint = point2 && point2.timestamp > point1.timestamp ? point2 : point1;

            setActivePrice(newerPoint.price);

            if (!point2) {
                setActivePriceDiff(null);
                setFormattedTime(formatter.format(new Date(point1.timestamp)));
                isTimeLabelReady.value = true;
                return;
            }

            const [startPoint, endPoint] =
                point1.timestamp <= point2.timestamp ? [point1, point2] : [point2, point1];

            setActivePriceDiff(getPriceDiff(startPoint.price, endPoint.price));
            setFormattedTime(
                `${formatter.format(new Date(startPoint.timestamp))} — ${formatter.format(new Date(endPoint.timestamp))}`
            );
            isTimeLabelReady.value = true;
        },
        [dateFormatter, selectedPeriod, isTimeLabelReady]
    );

    const onGestureEnd = useCallback(() => {
        setActivePrice(undefined);
        setActivePriceDiff(null);
        setFormattedTime('');
    }, []);

    const gesture = useMemo(() => {
        const emitActivePoints = (
            points: ChartPoint[],
            primaryIndex: number,
            secondaryIndex?: number
        ) => {
            'worklet';
            runOnJS(onPointsChanged)(getActivePoints(points, primaryIndex, secondaryIndex));
        };

        return Gesture.Manual()
            .onTouchesDown((e, manager) => {
                'worklet';
                const points = chartPointsShared.value;
                const fractions = pathFractionsShared.value;
                const touches = e.allTouches;

                if (touches.length < 1) return;

                manager.activate();

                let nextPrimaryIndex = primaryCrosshair.value.pointIndex;
                let nextSecondaryIndex = secondaryCrosshair.value.pointIndex;
                let shouldEmitPoints = false;

                const idx = findNearestIndex(points, touches[0].x);
                if (idx !== -1) {
                    const previousPrimaryIndex = primaryCrosshair.value.pointIndex;
                    setCrosshairPoint(primaryCrosshair, points, fractions, idx);
                    nextPrimaryIndex = idx;
                    if (idx !== previousPrimaryIndex) {
                        shouldEmitPoints = true;
                    }
                }

                if (touches.length >= 2) {
                    const idx2 = findNearestIndex(points, touches[1].x);
                    if (idx2 !== -1) {
                        const previousSecondaryIndex = secondaryCrosshair.value.pointIndex;
                        setCrosshairPoint(secondaryCrosshair, points, fractions, idx2);
                        nextSecondaryIndex = idx2;
                        if (idx2 !== previousSecondaryIndex) {
                            shouldEmitPoints = true;
                        }
                    }
                }

                if (shouldEmitPoints) {
                    emitActivePoints(points, nextPrimaryIndex, nextSecondaryIndex);
                }
            })
            .onTouchesMove(e => {
                'worklet';
                const points = chartPointsShared.value;
                const fractions = pathFractionsShared.value;
                const touches = e.allTouches;
                let nextPrimaryIndex = primaryCrosshair.value.pointIndex;
                let nextSecondaryIndex = secondaryCrosshair.value.pointIndex;
                let shouldEmitPoints = false;

                if (touches.length >= 1) {
                    const idx = findNearestIndex(points, touches[0].x);
                    if (idx !== -1) {
                        const previousPrimaryIndex = primaryCrosshair.value.pointIndex;
                        setCrosshairPoint(primaryCrosshair, points, fractions, idx);
                        nextPrimaryIndex = idx;
                        if (idx !== previousPrimaryIndex) {
                            shouldEmitPoints = true;
                        }
                    }
                }

                if (touches.length >= 2) {
                    const idx2 = findNearestIndex(points, touches[1].x);
                    if (idx2 !== -1) {
                        const previousSecondaryIndex = secondaryCrosshair.value.pointIndex;
                        setCrosshairPoint(secondaryCrosshair, points, fractions, idx2);
                        nextSecondaryIndex = idx2;
                        if (idx2 !== previousSecondaryIndex) {
                            shouldEmitPoints = true;
                        }
                    }
                } else if (secondaryCrosshair.value.isActive) {
                    clearCrosshair(secondaryCrosshair);
                    nextSecondaryIndex = -1;
                    shouldEmitPoints = true;
                }

                if (shouldEmitPoints) {
                    emitActivePoints(points, nextPrimaryIndex, nextSecondaryIndex);
                }
            })
            .onTouchesUp((e, manager) => {
                'worklet';
                const points = chartPointsShared.value;
                const remaining = e.numberOfTouches;

                if (remaining === 0) {
                    clearCrosshair(primaryCrosshair);
                    clearCrosshair(secondaryCrosshair);
                    isTimeLabelReady.value = false;
                    manager.end();
                    runOnJS(onGestureEnd)();
                } else if (remaining < 2 && secondaryCrosshair.value.isActive) {
                    clearCrosshair(secondaryCrosshair);
                    emitActivePoints(points, primaryCrosshair.value.pointIndex);
                }
            })
            .onTouchesCancelled((_e, manager) => {
                'worklet';
                clearCrosshair(primaryCrosshair);
                clearCrosshair(secondaryCrosshair);
                isTimeLabelReady.value = false;
                manager.end();
                runOnJS(onGestureEnd)();
            })
            .onFinalize(() => {
                'worklet';
                clearCrosshair(primaryCrosshair);
                clearCrosshair(secondaryCrosshair);
                isTimeLabelReady.value = false;
                runOnJS(onGestureEnd)();
            });
    }, [
        chartPointsShared,
        pathFractionsShared,
        primaryCrosshair,
        isTimeLabelReady,
        secondaryCrosshair,
        onPointsChanged,
        onGestureEnd
    ]);

    return {
        primaryCrosshair,
        secondaryCrosshair,
        isTimeLabelReady,
        activePrice,
        activePriceDiff,
        gesture,
        formattedTime
    };
};
