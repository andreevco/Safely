import { useCallback } from 'react';
import { LayoutChangeEvent, View } from 'react-native';
import Animated, {
    type SharedValue,
    useAnimatedStyle,
    useSharedValue
} from 'react-native-reanimated';

import { useDateFormatter } from '@safely/ux';

import { Text } from '@mobile/shared/ui';

import { styles } from './ChartFooter.styles';
import { Tick } from './Tick';
import { CHART_CONFIG, ChartPeriod } from '../../config';

type TicksProps = {
    selectedPeriod: ChartPeriod;
};

export const Ticks = (props: TicksProps) => {
    const { selectedPeriod } = props;

    const { tickConfig } = CHART_CONFIG[selectedPeriod];

    return (
        <View style={styles.ticksContainer}>
            {Array.from({ length: tickConfig.count }, (_, index) => (
                <Tick
                    key={index}
                    variant={tickConfig.tick(index)}
                    mediumTickColor={tickConfig.mediumTickColor}
                />
            ))}
        </View>
    );
};

type ChartFooterProps = {
    selectedPeriod: ChartPeriod;
    startDate: number;
    isActive: SharedValue<boolean>;
    isTimeLabelReady: SharedValue<boolean>;
    activeX: SharedValue<number>;
    formattedTime: string;
};

export const ChartFooter = (props: ChartFooterProps) => {
    const { selectedPeriod, startDate, isActive, isTimeLabelReady, activeX, formattedTime } = props;
    const dateFormatter = useDateFormatter();
    const containerWidth = useSharedValue(0);
    const timeLabelWidth = useSharedValue(0);

    const onContainerLayout = useCallback(
        (event: LayoutChangeEvent) => {
            containerWidth.value = event.nativeEvent.layout.width;
        },
        [containerWidth]
    );

    const onTimeLabelLayout = useCallback(
        (event: LayoutChangeEvent) => {
            timeLabelWidth.value = event.nativeEvent.layout.width;
        },
        [timeLabelWidth]
    );

    const datesAnimatedStyle = useAnimatedStyle(() => ({
        opacity: isActive.value ? 0 : 1
    }));

    const timeLabelAnimatedStyle = useAnimatedStyle(() => ({
        opacity: isActive.value && isTimeLabelReady.value ? 1 : 0,
        transform: [
            {
                translateX: Math.max(
                    0,
                    Math.min(
                        activeX.value - timeLabelWidth.value / 2,
                        containerWidth.value - timeLabelWidth.value
                    )
                )
            }
        ]
    }));

    return (
        <View style={styles.container}>
            <Ticks selectedPeriod={selectedPeriod} />
            <View style={styles.datesWrapper} onLayout={onContainerLayout}>
                <Animated.View style={[styles.dates, datesAnimatedStyle]}>
                    {CHART_CONFIG[selectedPeriod]
                        .getPeriodIntermediatePoints(startDate)
                        .slice(0, -1)
                        .map((date, index) => (
                            <View style={styles.dateContainer} key={index}>
                                <Text variant="bodyS" color="tertiary">
                                    {dateFormatter(
                                        CHART_CONFIG[selectedPeriod].footerDateFormat
                                    ).format(new Date(date))}
                                </Text>
                            </View>
                        ))}
                </Animated.View>
                <Animated.View
                    style={[styles.timeLabelContainer, timeLabelAnimatedStyle]}
                    onLayout={onTimeLabelLayout}
                    pointerEvents="none"
                >
                    <Text variant="bodyS" color="tertiary" monospace>
                        {formattedTime}
                    </Text>
                </Animated.View>
            </View>
        </View>
    );
};
