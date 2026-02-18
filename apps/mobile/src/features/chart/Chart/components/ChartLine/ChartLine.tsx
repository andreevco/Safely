import { Canvas, Circle, Path } from '@shopify/react-native-skia';
import Color from 'color';
import { useMemo, useState } from 'react';
import { LayoutChangeEvent, View } from 'react-native';

import { buildChartPath, buildChartPoints } from '@mobile/shared/utils/chart';

import { styles } from './ChartLine.styles';
import { CHART_CONFIG, ChartPeriod } from '../../config';

type ChartLineProps = {
    prices: [number, number][];
    startDate: number;
    selectedPeriod: ChartPeriod;
};

const LINE_COLOR = 'rgba(247, 147, 26, 1)';
const LINE_STROKE_WIDTH = 3;
const LAST_POINT_RADIUS = 4;

export const ChartLine = (props: ChartLineProps) => {
    const { prices, startDate, selectedPeriod } = props;
    const [size, setSize] = useState<{ width: number; height: number }>({
        width: 0,
        height: 0
    });

    const onLayout = (event: LayoutChangeEvent) => {
        const { width, height } = event.nativeEvent.layout;
        setSize({ width, height });
    };

    const [fadedPath, mainPath, lastPoint] = useMemo(() => {
        const [start, _, target] =
            CHART_CONFIG[selectedPeriod].getPeriodIndermediatePoints(startDate);

        const chartPoints = buildChartPoints(size.width, size.height, prices, {
            startTimestamp: start,
            endTimestamp: target
        });

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
    }, [prices, size.height, size.width, startDate, selectedPeriod]);

    return (
        <View style={styles.container}>
            <View style={styles.canvasContainer} onLayout={onLayout}>
                <Canvas style={styles.canvas}>
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
                    {lastPoint && (
                        <Circle
                            cx={lastPoint.x}
                            cy={lastPoint.y}
                            r={LAST_POINT_RADIUS}
                            color={LINE_COLOR}
                        />
                    )}
                </Canvas>
            </View>
        </View>
    );
};
