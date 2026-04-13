import { Canvas, Circle, Group, Line, Path, vec } from '@shopify/react-native-skia';
import { useState } from 'react';
import { LayoutChangeEvent, View } from 'react-native';
import { GestureDetector, GestureType } from 'react-native-gesture-handler';
import Animated, {
    type SharedValue,
    useAnimatedStyle,
    useDerivedValue,
    withDelay,
    withRepeat,
    withSequence,
    withTiming
} from 'react-native-reanimated';
import { useUnistyles } from 'react-native-unistyles';

import { ChartPeriod } from '@mobile/features/chart/Chart/config';
import {
    DOT_RADIUS,
    FADED_LINE_COLOR,
    LINE_COLOR,
    LINE_STROKE_WIDTH,
    OPAQUE_LINE_COLOR
} from '@mobile/features/chart/Chart/constants';
import { useChartPaths } from '@mobile/features/chart/Chart/hooks';
import type { CrosshairState } from '@mobile/features/chart/Chart/hooks/useCrosshair';
import { Text } from '@mobile/shared/ui';
import { formatCompactPrice, type ChartPoint } from '@mobile/shared/utils/chart';

import { styles } from './ChartLine.styles';

type ChartLineProps = {
    prices: [number, number][];
    startDate: number;
    selectedPeriod: ChartPeriod;
    chartPointsShared: SharedValue<ChartPoint[]>;
    pathFractionsShared: SharedValue<number[]>;
    primaryCrosshair: SharedValue<CrosshairState>;
    secondaryCrosshair: SharedValue<CrosshairState>;
    gesture: GestureType;
};

export const ChartLine = (props: ChartLineProps) => {
    const { theme } = useUnistyles();
    const {
        prices,
        startDate,
        selectedPeriod,
        chartPointsShared,
        pathFractionsShared,
        primaryCrosshair,
        secondaryCrosshair,
        gesture
    } = props;
    const [size, setSize] = useState({ width: 0, height: 0 });
    const onLayout = (event: LayoutChangeEvent) => {
        const { width, height } = event.nativeEvent.layout;
        setSize({ width, height });
    };

    const activeX = useDerivedValue(() => primaryCrosshair.value.x);
    const activeY = useDerivedValue(() => primaryCrosshair.value.y);
    const activeX2 = useDerivedValue(() => secondaryCrosshair.value.x);
    const activeY2 = useDerivedValue(() => secondaryCrosshair.value.y);
    const eitherActive = useDerivedValue(
        () => primaryCrosshair.value.isActive || secondaryCrosshair.value.isActive
    );
    const crosshairOpacity = useDerivedValue(() => (eitherActive.value ? 1 : 0));
    const pointsOpacity = useDerivedValue(() => (eitherActive.value ? 0 : 1));

    const crosshairP1 = useDerivedValue(() => vec(activeX.value, 0));
    const crosshairP2 = useDerivedValue(() => vec(activeX.value, size.height));

    const crosshair2P1 = useDerivedValue(() => vec(activeX2.value, 0));
    const crosshair2P2 = useDerivedValue(() => vec(activeX2.value, size.height));
    const crosshair2Opacity = useDerivedValue(() => (secondaryCrosshair.value.isActive ? 1 : 0));

    const minFraction = useDerivedValue(() => {
        if (!secondaryCrosshair.value.isActive) return 0;
        return Math.min(primaryCrosshair.value.pathFraction, secondaryCrosshair.value.pathFraction);
    });
    const maxFraction = useDerivedValue(() => {
        if (!primaryCrosshair.value.isActive) return 0;
        if (!secondaryCrosshair.value.isActive) return primaryCrosshair.value.pathFraction;
        return Math.max(primaryCrosshair.value.pathFraction, secondaryCrosshair.value.pathFraction);
    });

    const { fullPath, periodSplitEnd, lastPoint, elegantPrices, splitPoint } = useChartPaths({
        prices,
        width: size.width,
        height: size.height,
        startDate,
        selectedPeriod,
        chartPointsShared,
        pathFractionsShared
    });

    const priceLabelsStyle = useAnimatedStyle(() => {
        if (!eitherActive.value) return { opacity: 1 };
        const near =
            primaryCrosshair.value.x > size.width - 40 ||
            (secondaryCrosshair.value.isActive && secondaryCrosshair.value.x > size.width - 40);
        return { opacity: withTiming(near ? 0 : 1, { duration: 60 }) };
    });

    const animatedCircleColor = useDerivedValue(() => {
        return withRepeat(
            withSequence(
                withTiming(LINE_COLOR, { duration: 1000 }),
                withDelay(1500, withTiming(OPAQUE_LINE_COLOR, { duration: 1000 }))
            ),
            -1,
            true
        );
    });

    return (
        <View style={styles.container}>
            <GestureDetector gesture={gesture}>
                <View style={styles.canvasContainer} onLayout={onLayout}>
                    <Animated.View
                        style={[styles.priceLabelsContainer, priceLabelsStyle]}
                        pointerEvents="none"
                    >
                        {elegantPrices
                            ?.slice(0, 3)
                            .filter(item => item.shouldBeRendered)
                            .map(item => (
                                <Animated.View
                                    key={`price-${item.price}`}
                                    style={[styles.priceLabel, { top: item.y }]}
                                >
                                    <Text monospace variant="bodyS" color="tertiary">
                                        {formatCompactPrice(item.price)}
                                    </Text>
                                </Animated.View>
                            ))}
                    </Animated.View>
                    <Canvas style={styles.canvas}>
                        {/* Horizontal reference lines */}
                        {elegantPrices?.slice(1, 3).map((item, index) => (
                            <Line
                                key={`ref-${index}`}
                                p1={vec(0, item.y)}
                                p2={vec(size.width, item.y)}
                                color={theme.colors.other.transparentElement}
                                strokeWidth={0.5}
                            />
                        ))}

                        {/* Crosshair vertical line */}
                        <Group opacity={crosshairOpacity}>
                            <Line
                                p1={crosshairP1}
                                p2={crosshairP2}
                                color={theme.colors.icon.tertiary}
                                strokeWidth={1}
                            />
                        </Group>
                        <Group opacity={crosshair2Opacity}>
                            <Line
                                p1={crosshair2P1}
                                p2={crosshair2P2}
                                color={theme.colors.icon.tertiary}
                                strokeWidth={1}
                            />
                        </Group>

                        {/* Inactive mode: period-based faded/main split */}
                        {periodSplitEnd > 0 && (
                            <Group opacity={pointsOpacity}>
                                <Path
                                    path={fullPath}
                                    color={FADED_LINE_COLOR}
                                    strokeWidth={LINE_STROKE_WIDTH}
                                    style="stroke"
                                    end={periodSplitEnd}
                                />
                            </Group>
                        )}
                        <Group opacity={pointsOpacity}>
                            <Path
                                path={fullPath}
                                color={LINE_COLOR}
                                strokeWidth={LINE_STROKE_WIDTH}
                                style="stroke"
                                start={periodSplitEnd}
                            />
                        </Group>

                        {splitPoint && (
                            <Group opacity={pointsOpacity}>
                                <Circle
                                    cx={splitPoint.x}
                                    cy={splitPoint.y}
                                    r={DOT_RADIUS + 1}
                                    color={theme.colors.background.secondary}
                                />
                                <Circle
                                    cx={splitPoint.x}
                                    cy={splitPoint.y}
                                    r={DOT_RADIUS}
                                    color={LINE_COLOR}
                                />
                            </Group>
                        )}

                        {/* Active mode: bright before crosshair, faded after */}
                        <Group opacity={crosshairOpacity}>
                            <Path
                                path={fullPath}
                                color={FADED_LINE_COLOR}
                                strokeWidth={LINE_STROKE_WIDTH}
                                style="stroke"
                                end={minFraction}
                            />
                            <Path
                                path={fullPath}
                                color={LINE_COLOR}
                                strokeWidth={LINE_STROKE_WIDTH}
                                style="stroke"
                                start={minFraction}
                                end={maxFraction}
                            />
                            <Path
                                path={fullPath}
                                color={FADED_LINE_COLOR}
                                strokeWidth={LINE_STROKE_WIDTH}
                                style="stroke"
                                start={maxFraction}
                            />
                        </Group>

                        {/* Last point dot (hidden during gesture) */}
                        {lastPoint && (
                            <Group opacity={pointsOpacity}>
                                <Circle
                                    cx={lastPoint.x}
                                    cy={lastPoint.y}
                                    r={DOT_RADIUS + 1}
                                    color={theme.colors.background.secondary}
                                />
                                <Circle
                                    cx={lastPoint.x}
                                    cy={lastPoint.y}
                                    r={DOT_RADIUS}
                                    color={animatedCircleColor}
                                />
                            </Group>
                        )}

                        {/* Crosshair dot */}
                        <Group opacity={crosshairOpacity}>
                            <Circle
                                cx={activeX}
                                cy={activeY}
                                r={DOT_RADIUS + 1}
                                color={theme.colors.background.secondary}
                            />
                            <Circle cx={activeX} cy={activeY} r={DOT_RADIUS} color={LINE_COLOR} />
                        </Group>
                        <Group opacity={crosshair2Opacity}>
                            <Circle
                                cx={activeX2}
                                cy={activeY2}
                                r={DOT_RADIUS + 1}
                                color={theme.colors.background.secondary}
                            />
                            <Circle cx={activeX2} cy={activeY2} r={DOT_RADIUS} color={LINE_COLOR} />
                        </Group>
                    </Canvas>
                </View>
            </GestureDetector>
        </View>
    );
};
