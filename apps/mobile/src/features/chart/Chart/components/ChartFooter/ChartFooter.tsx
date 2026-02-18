import { View } from 'react-native';

import { Text } from '@mobile/shared/ui';

import { styles } from './ChartFooter.styles';
import { TICK_CONFIG_BY_PERIOD } from './config';
import { Tick } from './Tick';
import { CHART_CONFIG, ChartPeriod } from '../../config';

type TicksProps = {
    selectedPeriod: ChartPeriod;
};

export const Ticks = (props: TicksProps) => {
    const { selectedPeriod } = props;

    return (
        <View style={styles.ticksContainer}>
            {Array.from({ length: TICK_CONFIG_BY_PERIOD[selectedPeriod].count }, (_, index) => (
                <Tick
                    key={index}
                    variant={TICK_CONFIG_BY_PERIOD[selectedPeriod].tick(index)}
                    mediumTickColor={TICK_CONFIG_BY_PERIOD[selectedPeriod].mediumTickColor}
                />
            ))}
        </View>
    );
};

const formatDate = (date: number, period: ChartPeriod): string => {
    switch (period) {
        case ChartPeriod.ONE_HOUR:
            return new Date(date).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit'
            });
        case ChartPeriod.ONE_MONTH:
            return new Date(date).toLocaleDateString('en-US', {
                month: 'short'
            });
        case ChartPeriod.NINETY_DAYS:
            return new Date(date).toLocaleDateString('en-US', {
                month: 'short',
                year: 'numeric'
            });
        case ChartPeriod.ONE_YEAR:
            return new Date(date).toLocaleDateString('en-US', {
                year: 'numeric'
            });
        default:
            return new Date(date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric'
            });
    }
};

type ChartFooterProps = {
    selectedPeriod: ChartPeriod;
    startDate: number;
};

export const ChartFooter = (props: ChartFooterProps) => {
    const { selectedPeriod, startDate } = props;

    return (
        <View style={styles.container}>
            <Ticks selectedPeriod={selectedPeriod} />
            <View style={styles.dates}>
                {CHART_CONFIG[selectedPeriod]
                    .getPeriodIndermediatePoints(startDate)
                    .slice(0, -1)
                    .map((date, index) => (
                        <View style={styles.dateContainer} key={index}>
                            <Text variant="bodyS" color="tertiary">
                                {formatDate(date, selectedPeriod)}
                            </Text>
                        </View>
                    ))}
            </View>
        </View>
    );
};
