import { Canvas, Circle, Line, Path, vec } from '@shopify/react-native-skia';
import Color from 'color';
import { useCallback, useMemo, useState } from 'react';
import { LayoutChangeEvent, View } from 'react-native';
import { GestureDetector, GestureType } from 'react-native-gesture-handler';
import { useUnistyles } from 'react-native-unistyles';

import { Text } from '@mobile/shared/ui';
import { buildChartPath, buildChartPoints, type ChartPoint } from '@mobile/shared/utils/chart';

import { styles } from './ChartLine.styles';
import { CHART_CONFIG, ChartPeriod } from '../../config';

type ChartLineProps = {
    prices: [number, number][];
    startDate: number;
    selectedPeriod: ChartPeriod;
    chartPointsRef: React.RefObject<ChartPoint[]>;
    activePoint: ChartPoint | null;
    gesture: GestureType;
    formattedTime: string;
};

const LINE_COLOR = 'rgba(247, 147, 26, 1)';
const LINE_STROKE_WIDTH = 1.5;
const LAST_POINT_RADIUS = 4;
const CROSSHAIR_DOT_RADIUS = 2;

export const ChartLine = (props: ChartLineProps) => {
    const { theme } = useUnistyles();
    const {
        prices,
        startDate,
        selectedPeriod,
        chartPointsRef,
        activePoint,
        gesture,
        formattedTime
    } = props;
    const [size, setSize] = useState({ width: 0, height: 0 });
    const [timeLabelWidth, setTimeLabelWidth] = useState(0);

    const onLayout = (event: LayoutChangeEvent) => {
        const { width, height } = event.nativeEvent.layout;
        setSize({ width, height });
    };

    const onTimeLabelLayout = useCallback((event: LayoutChangeEvent) => {
        setTimeLabelWidth(event.nativeEvent.layout.width);
    }, []);

    const timeLabelLeft = activePoint
        ? Math.max(0, Math.min(activePoint.x - timeLabelWidth / 2, size.width - timeLabelWidth))
        : 0;

    const [fadedPath, mainPath, lastPoint] = useMemo(() => {
        const [start, _, target] =
            CHART_CONFIG[selectedPeriod].getPeriodIndermediatePoints(startDate);

        const chartPoints = buildChartPoints(size.width, size.height, prices, {
            startTimestamp: start,
            endTimestamp: target
        });

        chartPointsRef.current = chartPoints;

        const splitPoint = Date.now() - CHART_CONFIG[selectedPeriod].fullPeriodLength;
        const splitIndex = chartPoints.findIndex(point => point.timestamp >= splitPoint);

        const last = chartPoints[chartPoints.length - 1];

        if (splitIndex === -1) {
            return [null, buildChartPath(chartPoints), last];
        }

        const fadedPoints = chartPoints.slice(0, splitIndex + 1);
        const mainPoints = chartPoints.slice(splitIndex);

        return [
            buildChartPath(fadedPoints),
            buildChartPath(mainPoints),
            last ? { x: last.x, y: last.y } : null
        ] as const;
    }, [prices, size.height, size.width, startDate, selectedPeriod, chartPointsRef]);

    return (
        <View style={styles.container}>
            <GestureDetector gesture={gesture}>
                <View style={styles.canvasContainer} onLayout={onLayout}>
                    <Canvas style={styles.canvas}>
                        {activePoint && (
                            <Line
                                p1={vec(activePoint.x, 0)}
                                p2={vec(activePoint.x, size.height)}
                                color={theme.colors.icon.tertiary}
                                strokeWidth={1}
                            />
                        )}
                        {fadedPath && (
                            <Path
                                path={fadedPath}
                                color={new Color(LINE_COLOR).alpha(0.48).toString()}
                                strokeWidth={LINE_STROKE_WIDTH}
                                style="stroke"
                            />
                        )}
                        <Path
                            path={mainPath}
                            color={LINE_COLOR}
                            strokeWidth={LINE_STROKE_WIDTH}
                            style="stroke"
                        />
                        {lastPoint && !activePoint && (
                            <Circle
                                cx={lastPoint.x}
                                cy={lastPoint.y}
                                r={LAST_POINT_RADIUS + 2}
                                color={theme.colors.background.secondary}
                            >
                                <Circle
                                    cx={lastPoint.x}
                                    cy={lastPoint.y}
                                    r={LAST_POINT_RADIUS}
                                    color={LINE_COLOR}
                                />
                            </Circle>
                        )}
                        {activePoint && (
                            <Circle
                                cx={activePoint.x}
                                cy={activePoint.y}
                                r={CROSSHAIR_DOT_RADIUS + 1}
                                color={theme.colors.background.secondary}
                            >
                                <Circle
                                    cx={activePoint.x}
                                    cy={activePoint.y}
                                    r={CROSSHAIR_DOT_RADIUS}
                                    color={LINE_COLOR}
                                />
                            </Circle>
                        )}
                    </Canvas>
                    {activePoint && (
                        <View
                            style={[styles.timeLabelContainer, { left: timeLabelLeft }]}
                            onLayout={onTimeLabelLayout}
                            pointerEvents="none"
                        >
                            <Text variant="bodyM" monospace style={styles.timeLabelText}>
                                {formattedTime}
                            </Text>
                        </View>
                    )}
                </View>
            </GestureDetector>
        </View>
    );
};
