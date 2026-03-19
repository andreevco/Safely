import { useMemo } from 'react';
import { View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';

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
    const chartPointsShared = useSharedValue<ChartPoint[]>([]);
    const pathFractionsShared = useSharedValue<number[]>([]);

    const stickyStartDate = useMemo(() => {
        const periodConfig = CHART_CONFIG[selectedPeriod];
        return periodConfig.startOfPeriod(new Date(Date.now() - periodConfig.fullPeriodLength));
    }, [selectedPeriod]);
    const chart = useChart(asset, stickyStartDate);
    const crosshair = useCrosshair({ chartPointsShared, pathFractionsShared, selectedPeriod });

    return (
        <View style={styles.container}>
            <ChartHeader
                prices={chart.data?.prices ?? []}
                asset={asset}
                selectedPeriod={selectedPeriod}
                activePrice={crosshair.activePrice}
            />
            <ChartPeriods selectedPeriod={selectedPeriod} onSelectPeriod={setSelectedPeriod} />
            <ChartLine
                startDate={stickyStartDate}
                prices={chart.data?.prices ?? []}
                selectedPeriod={selectedPeriod}
                chartPointsShared={chartPointsShared}
                pathFractionsShared={pathFractionsShared}
                activeX={crosshair.activeX}
                activeY={crosshair.activeY}
                isActive={crosshair.isActive}
                activePathFraction={crosshair.activePathFraction}
                gesture={crosshair.gesture}
            />
            <ChartFooter
                startDate={stickyStartDate}
                selectedPeriod={selectedPeriod}
                isActive={crosshair.isActive}
                isTimeLabelReady={crosshair.isTimeLabelReady}
                activeX={crosshair.activeX}
                formattedTime={crosshair.formattedTime}
            />
        </View>
    );
};
