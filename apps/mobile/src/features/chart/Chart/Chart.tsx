import { useMemo, useState } from 'react';
import { View } from 'react-native';

import { BTC_ASSET } from '@safely/core';
import { useChart } from '@safely/ux/entities/asset/useChart';

import { styles } from './Chart.styles';
import { ChartHeader, ChartLine, ChartPeriods, ChartFooter } from './components';
import { CHART_CONFIG, ChartPeriod } from './config';

export const Chart = () => {
    const asset = BTC_ASSET;
    const [selectedPeriod, setSelectedPeriod] = useState<ChartPeriod>(ChartPeriod.ONE_DAY);

    const stickyStartDate = useMemo(() => {
        const periodConfig = CHART_CONFIG[selectedPeriod];
        return periodConfig.startOfPeriod(new Date(Date.now() - periodConfig.fullPeriodLength));
    }, [selectedPeriod]);
    const chart = useChart(asset, stickyStartDate);

    return (
        <View style={styles.container}>
            <ChartHeader
                prices={chart.data?.prices ?? []}
                asset={asset}
                selectedPeriod={selectedPeriod}
            />
            <ChartPeriods selectedPeriod={selectedPeriod} onSelectPeriod={setSelectedPeriod} />
            <ChartLine
                startDate={stickyStartDate}
                prices={chart.data?.prices ?? []}
                selectedPeriod={selectedPeriod}
            />
            <ChartFooter startDate={stickyStartDate} selectedPeriod={selectedPeriod} />
        </View>
    );
};
