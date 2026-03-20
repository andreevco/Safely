import { Canvas, Circle, Group, Line, Path, vec } from '@shopify/react-native-skia';
import { useState } from 'react';
import { LayoutChangeEvent, View } from 'react-native';
import { GestureDetector, GestureType } from 'react-native-gesture-handler';
import { type SharedValue, useDerivedValue } from 'react-native-reanimated';
import { useUnistyles } from 'react-native-unistyles';

import type { ChartPoint } from '@mobile/shared/utils/chart';

import { styles } from './ChartLine.styles';
import { ChartPeriod } from '../../config';
import {
    CROSSHAIR_DOT_RADIUS,
    FADED_LINE_COLOR,
    LAST_POINT_RADIUS,
    LINE_COLOR,
    LINE_STROKE_WIDTH
} from '../../constants';
import { useChartPaths } from '../../hooks';

type ChartLineProps = {
    prices: [number, number][];
    startDate: number;
    selectedPeriod: ChartPeriod;
    chartPointsShared: SharedValue<ChartPoint[]>;
    pathFractionsShared: SharedValue<number[]>;
    activeX: SharedValue<number>;
    activeY: SharedValue<number>;
    isActive: SharedValue<boolean>;
    activePathFraction: SharedValue<number>;
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
        activeX,
        activeY,
        isActive,
        activePathFraction,
        gesture
    } = props;
    const [size, setSize] = useState({ width: 0, height: 0 });
    const onLayout = (event: LayoutChangeEvent) => {
        const { width, height } = event.nativeEvent.layout;
        setSize({ width, height });
    };

    const crosshairOpacity = useDerivedValue(() => (isActive.value ? 1 : 0));
    const lastPointOpacity = useDerivedValue(() => (isActive.value ? 0 : 1));

    const crosshairP1 = useDerivedValue(() => vec(activeX.value, 0));
    const crosshairP2 = useDerivedValue(() => vec(activeX.value, size.height));

    const { fullPath, periodSplitEnd, lastPoint } = useChartPaths({
        prices,
        width: size.width,
        height: size.height,
        startDate,
        selectedPeriod,
        chartPointsShared,
        pathFractionsShared
    });

    return (
        <View style={styles.container}>
            <GestureDetector gesture={gesture}>
                <View style={styles.canvasContainer} onLayout={onLayout}>
                    <Canvas style={styles.canvas}>
                        {/* Crosshair vertical line */}
                        <Group opacity={crosshairOpacity}>
                            <Line
                                p1={crosshairP1}
                                p2={crosshairP2}
                                color={theme.colors.icon.tertiary}
                                strokeWidth={1}
                            />
                        </Group>

                        {/* Inactive mode: period-based faded/main split */}
                        {periodSplitEnd > 0 && (
                            <Group opacity={lastPointOpacity}>
                                <Path
                                    path={fullPath}
                                    color={FADED_LINE_COLOR}
                                    strokeWidth={LINE_STROKE_WIDTH}
                                    style="stroke"
                                    end={periodSplitEnd - 0.005}
                                />
                            </Group>
                        )}
                        <Group opacity={lastPointOpacity}>
                            <Path
                                path={fullPath}
                                color={LINE_COLOR}
                                strokeWidth={LINE_STROKE_WIDTH}
                                style="stroke"
                                start={periodSplitEnd}
                            />
                        </Group>

                        {/* Active mode: bright before crosshair, faded after */}
                        <Group opacity={crosshairOpacity}>
                            <Path
                                path={fullPath}
                                color={LINE_COLOR}
                                strokeWidth={LINE_STROKE_WIDTH}
                                style="stroke"
                                end={activePathFraction}
                            />
                            <Path
                                path={fullPath}
                                color={FADED_LINE_COLOR}
                                strokeWidth={LINE_STROKE_WIDTH}
                                style="stroke"
                                start={activePathFraction}
                            />
                        </Group>

                        {/* Last point dot (hidden during gesture) */}
                        {lastPoint && (
                            <Group opacity={lastPointOpacity}>
                                <Circle
                                    cx={lastPoint.x}
                                    cy={lastPoint.y}
                                    r={LAST_POINT_RADIUS + 2}
                                    color={theme.colors.background.secondary}
                                />
                                <Circle
                                    cx={lastPoint.x}
                                    cy={lastPoint.y}
                                    r={LAST_POINT_RADIUS}
                                    color={LINE_COLOR}
                                />
                            </Group>
                        )}

                        {/* Crosshair dot */}
                        <Group opacity={crosshairOpacity}>
                            <Circle
                                cx={activeX}
                                cy={activeY}
                                r={CROSSHAIR_DOT_RADIUS + 1}
                                color={theme.colors.background.secondary}
                            />
                            <Circle
                                cx={activeX}
                                cy={activeY}
                                r={CROSSHAIR_DOT_RADIUS}
                                color={LINE_COLOR}
                            />
                        </Group>
                    </Canvas>
                </View>
            </GestureDetector>
        </View>
    );
};
