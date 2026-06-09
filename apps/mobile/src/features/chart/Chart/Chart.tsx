import { useMemo } from 'react';
import { View } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';

import { BTC_ASSET } from '@safely/core';
import { useChart } from '@safely/ux';

import type { ChartPoint } from '@mobile/shared/utils/chart';

import { styles } from './Chart.styles';
import { ChartHeader, ChartLine, ChartPeriods, ChartFooter, ChartLineSkeleton } from './components';
import { CHART_CONFIG, ChartPeriod } from './config';
import { useChartPeriodQuery, useSetChartPeriod, useCrosshair } from './hooks';

export const Chart = () => {
    const asset = BTC_ASSET;
    const { data: selectedPeriod = ChartPeriod.ONE_MONTH, isLoading } = useChartPeriodQuery();
    const { mutate: setSelectedPeriod } = useSetChartPeriod();
    const chartPointsShared = useSharedValue<ChartPoint[]>([]);
    const pathFractionsShared = useSharedValue<number[]>([]);

    const stickyStartDate = useMemo(() => {
        const periodConfig = CHART_CONFIG[selectedPeriod];
        return periodConfig.startOfPeriod(new Date(Date.now() - periodConfig.fullPeriodLength));
    }, [selectedPeriod]);
    const chart = useChart(asset, stickyStartDate);
    const crosshair = useCrosshair({ chartPointsShared, pathFractionsShared, selectedPeriod });

    const prices = chart.data?.prices ?? [];

    return (
        <View style={styles.container}>
            <ChartHeader
                prices={prices}
                asset={asset}
                selectedPeriod={selectedPeriod}
                activePrice={crosshair.activePrice}
                activePriceDiff={crosshair.activePriceDiff}
            />
            <ChartPeriods selectedPeriod={selectedPeriod} onSelectPeriod={setSelectedPeriod} />
            {isLoading ? (
                <ChartLineSkeleton />
            ) : (
                <ChartLine
                    startDate={stickyStartDate}
                    prices={prices}
                    selectedPeriod={selectedPeriod}
                    chartPointsShared={chartPointsShared}
                    pathFractionsShared={pathFractionsShared}
                    primaryCrosshair={crosshair.primaryCrosshair}
                    secondaryCrosshair={crosshair.secondaryCrosshair}
                    gesture={crosshair.gesture}
                />
            )}
            <ChartFooter
                startDate={stickyStartDate}
                selectedPeriod={selectedPeriod}
                primaryCrosshair={crosshair.primaryCrosshair}
                isTimeLabelReady={crosshair.isTimeLabelReady}
                formattedTime={crosshair.formattedTime}
                secondaryCrosshair={crosshair.secondaryCrosshair}
            />
        </View>
    );
};
