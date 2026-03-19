import { impactAsync, ImpactFeedbackStyle, selectionAsync } from 'expo-haptics';
import { useCallback, useMemo, useState } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import { type SharedValue, useSharedValue } from 'react-native-reanimated';
import { runOnJS } from 'react-native-worklets';

import { useDateFormatter } from '@safely/ux';

import type { ChartPoint } from '@mobile/shared/utils/chart';

import { CHART_CONFIG, ChartPeriod } from '../config';

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

type UseCrosshairParams = {
    chartPointsShared: SharedValue<ChartPoint[]>;
    pathFractionsShared: SharedValue<number[]>;
    selectedPeriod: ChartPeriod;
};

export const useCrosshair = (params: UseCrosshairParams) => {
    const { chartPointsShared, pathFractionsShared, selectedPeriod } = params;

    const isActive = useSharedValue(false);
    const activeX = useSharedValue(0);
    const activeY = useSharedValue(0);
    const lastPointIndex = useSharedValue(-1);
    const activePathFraction = useSharedValue(0);
    const isTimeLabelReady = useSharedValue(false);

    const [activePrice, setActivePrice] = useState<number | undefined>(undefined);
    const [formattedTime, setFormattedTime] = useState('');
    const dateFormatter = useDateFormatter();

    const onPointChanged = useCallback(
        (timestamp: number, price: number) => {
            void selectionAsync();
            setActivePrice(price);
            setFormattedTime(
                dateFormatter(CHART_CONFIG[selectedPeriod].crosshairDateFormat).format(
                    new Date(timestamp)
                )
            );
            isTimeLabelReady.value = true;
        },
        [dateFormatter, selectedPeriod, isTimeLabelReady]
    );

    const triggerHaptic = useCallback(() => {
        void impactAsync(ImpactFeedbackStyle.Light);
    }, []);

    const onGestureEnd = useCallback(() => {
        setActivePrice(undefined);
        setFormattedTime('');
    }, []);

    const gesture = useMemo(
        () =>
            Gesture.Pan()
                .onStart(e => {
                    'worklet';
                    isActive.value = true;
                    isTimeLabelReady.value = false;
                    runOnJS(triggerHaptic)();

                    const points = chartPointsShared.value;
                    const idx = findNearestIndex(points, e.x);
                    if (idx === -1) return;

                    activeX.value = points[idx].x;
                    activeY.value = points[idx].y;
                    activePathFraction.value = pathFractionsShared.value[idx] ?? 0;
                    lastPointIndex.value = idx;
                    runOnJS(onPointChanged)(points[idx].timestamp, points[idx].price);
                })
                .onUpdate(e => {
                    'worklet';
                    const points = chartPointsShared.value;
                    const idx = findNearestIndex(points, e.x);
                    if (idx === -1) return;

                    activeX.value = points[idx].x;
                    activeY.value = points[idx].y;
                    activePathFraction.value = pathFractionsShared.value[idx] ?? 0;

                    if (idx !== lastPointIndex.value) {
                        lastPointIndex.value = idx;
                        runOnJS(onPointChanged)(points[idx].timestamp, points[idx].price);
                    }
                })
                .onEnd(() => {
                    'worklet';
                    isActive.value = false;
                    lastPointIndex.value = -1;
                    runOnJS(onGestureEnd)();
                }),
        [
            chartPointsShared,
            pathFractionsShared,
            isActive,
            activeX,
            activeY,
            activePathFraction,
            isTimeLabelReady,
            lastPointIndex,
            triggerHaptic,
            onPointChanged,
            onGestureEnd
        ]
    );

    return {
        activeX,
        activeY,
        isActive,
        activePathFraction,
        isTimeLabelReady,
        activePrice,
        gesture,
        formattedTime
    };
};
