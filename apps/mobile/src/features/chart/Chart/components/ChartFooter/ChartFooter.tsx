import { useCallback } from 'react';
import type { LayoutChangeEvent } from 'react-native';
import { View } from 'react-native';
import Animated, {
    type SharedValue,
    useAnimatedStyle,
    useSharedValue
} from 'react-native-reanimated';

import { useDateFormatter } from '@safely/ux';

import { Text } from '@mobile/shared/ui';

import { styles } from './ChartFooter.styles';
import { Tick } from './Tick';
import type { ChartPeriod } from '../../config';
import { CHART_CONFIG } from '../../config';
import type { CrosshairState } from '../../hooks/useCrosshair';

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
    primaryCrosshair: SharedValue<CrosshairState>;
    isTimeLabelReady: SharedValue<boolean>;
    formattedTime: string;
    secondaryCrosshair: SharedValue<CrosshairState>;
};

export const ChartFooter = (props: ChartFooterProps) => {
    const {
        selectedPeriod,
        startDate,
        primaryCrosshair,
        isTimeLabelReady,
        formattedTime,
        secondaryCrosshair
    } = props;
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
        opacity: primaryCrosshair.value.isActive ? 0 : 1
    }));

    const timeLabelAnimatedStyle = useAnimatedStyle(() => {
        const labelAnchorX = secondaryCrosshair.value.isActive
            ? (primaryCrosshair.value.x + secondaryCrosshair.value.x) / 2
            : primaryCrosshair.value.x;

        return {
            opacity: primaryCrosshair.value.isActive && isTimeLabelReady.value ? 1 : 0,
            transform: [
                {
                    translateX: Math.max(
                        0,
                        Math.min(
                            labelAnchorX - timeLabelWidth.value / 2,
                            containerWidth.value - timeLabelWidth.value
                        )
                    )
                }
            ]
        };
    });

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
