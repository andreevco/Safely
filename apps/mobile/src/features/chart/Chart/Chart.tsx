import { useMemo, useRef } from 'react';
import { View } from 'react-native';
import Animated from 'react-native-reanimated';

import { BTC_ASSET } from '@safely/core';
import { useChart } from '@safely/ux/entities/asset/useChart';

import type { ChartPoint } from '@mobile/shared/utils/chart';

import { styles } from './Chart.styles';
import { ChartHeader, ChartLine, ChartPeriods, ChartFooter } from './components';
import { CHART_CONFIG, ChartPeriod } from './config';
import { useChartPeriodQuery, useSetChartPeriod, useCrosshair } from './hooks';

export const Chart = () => {
    const asset = BTC_ASSET;
    const { data: selectedPeriod = ChartPeriod.ONE_MONTH } = useChartPeriodQuery();
    const { mutate: setSelectedPeriod } = useSetChartPeriod();
    const chartPointsRef = useRef<ChartPoint[]>([]);

    const stickyStartDate = useMemo(() => {
        const periodConfig = CHART_CONFIG[selectedPeriod];
        return periodConfig.startOfPeriod(new Date(Date.now() - periodConfig.fullPeriodLength));
    }, [selectedPeriod]);
    const chart = useChart(asset, stickyStartDate);
    const crosshair = useCrosshair({ chartPointsRef, selectedPeriod });

    return (
        <View style={styles.container}>
            <ChartHeader
                prices={chart.data?.prices ?? []}
                asset={asset}
                selectedPeriod={selectedPeriod}
                activePrice={crosshair.activePoint?.price}
            />
            <Animated.View style={crosshair.periodsAnimatedStyle}>
                <ChartPeriods selectedPeriod={selectedPeriod} onSelectPeriod={setSelectedPeriod} />
            </Animated.View>
            <ChartLine
                startDate={stickyStartDate}
                prices={chart.data?.prices ?? []}
                selectedPeriod={selectedPeriod}
                chartPointsRef={chartPointsRef}
                activePoint={crosshair.activePoint}
                gesture={crosshair.gesture}
                formattedTime={crosshair.formattedTime}
            />
            <ChartFooter startDate={stickyStartDate} selectedPeriod={selectedPeriod} />
        </View>
    );
};
