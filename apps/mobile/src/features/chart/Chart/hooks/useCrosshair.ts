import { impactAsync, ImpactFeedbackStyle, selectionAsync } from 'expo-haptics';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Gesture } from 'react-native-gesture-handler';
import { useAnimatedStyle, useSharedValue } from 'react-native-reanimated';
import { runOnJS } from 'react-native-worklets';

import { useDateFormatter } from '@safely/ux';

import type { ChartPoint } from '@mobile/shared/utils/chart';

import { ChartPeriod } from '../config';

const getTimeLabelFormat = (period: ChartPeriod): Intl.DateTimeFormatOptions => {
    switch (period) {
        case ChartPeriod.ONE_HOUR:
        case ChartPeriod.ONE_DAY:
            return { hour: 'numeric', minute: '2-digit' };
        case ChartPeriod.ONE_WEEK:
        case ChartPeriod.ONE_MONTH:
        case ChartPeriod.NINETY_DAYS:
            return { month: 'short', day: 'numeric' };
        default:
            return { month: 'short', year: 'numeric' };
    }
};

type UseCrosshairParams = {
    chartPointsRef: React.RefObject<ChartPoint[]>;
    selectedPeriod: ChartPeriod;
};

export const useCrosshair = (params: UseCrosshairParams) => {
    const { chartPointsRef, selectedPeriod } = params;

    const [activePoint, setActivePoint] = useState<ChartPoint | null>(null);
    const lastPointIndexRef = useRef(-1);
    const isActive = useSharedValue(false);
    const dateFormatter = useDateFormatter();

    const findNearestPoint = useCallback(
        (touchX: number): ChartPoint | null => {
            const points = chartPointsRef.current;
            if (!points || points.length === 0) return null;

            let closest = points[0];
            let minDist = Math.abs(points[0].x - touchX);

            for (let i = 1; i < points.length; i++) {
                const dist = Math.abs(points[i].x - touchX);
                if (dist < minDist) {
                    minDist = dist;
                    closest = points[i];
                }
            }

            return closest;
        },
        [chartPointsRef]
    );

    const handleGestureActive = useCallback(
        (x: number) => {
            const point = findNearestPoint(x);
            if (!point) return;

            const points = chartPointsRef.current;
            const pointIndex = points ? points.indexOf(point) : -1;

            if (pointIndex !== lastPointIndexRef.current) {
                lastPointIndexRef.current = pointIndex;
                void selectionAsync();
            }

            setActivePoint(point);
        },
        [findNearestPoint, chartPointsRef]
    );

    const handleGestureEnd = useCallback(() => {
        lastPointIndexRef.current = -1;
        setActivePoint(null);
    }, []);

    const triggerHaptic = useCallback(() => {
        void impactAsync(ImpactFeedbackStyle.Light);
    }, []);

    const gesture = useMemo(
        () =>
            Gesture.Pan()
                .activateAfterLongPress(200)
                .minDistance(0)
                .onStart(e => {
                    'worklet';
                    isActive.value = true;
                    runOnJS(triggerHaptic)();
                    runOnJS(handleGestureActive)(e.x);
                })
                .onUpdate(e => {
                    'worklet';
                    runOnJS(handleGestureActive)(e.x);
                })
                .onEnd(() => {
                    'worklet';
                    isActive.value = false;
                    runOnJS(handleGestureEnd)();
                }),
        [handleGestureActive, handleGestureEnd, triggerHaptic, isActive]
    );

    const formattedTime = useMemo(() => {
        if (!activePoint) return '';
        return dateFormatter(getTimeLabelFormat(selectedPeriod)).format(
            new Date(activePoint.timestamp)
        );
    }, [activePoint, dateFormatter, selectedPeriod]);

    const periodsAnimatedStyle = useAnimatedStyle(() => ({
        opacity: isActive.value ? 0 : 1
    }));

    return {
        activePoint,
        gesture,
        formattedTime,
        periodsAnimatedStyle
    };
};
