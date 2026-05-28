import type { ViewProps } from 'react-native';
import type { SharedValue } from 'react-native-reanimated';
import Animated, {
    useAnimatedReaction,
    useAnimatedStyle,
    useSharedValue,
    withSequence,
    withTiming
} from 'react-native-reanimated';

import { Dot } from './Dot';
import { styles } from './PasscodeInput.styles';

export interface PasscodeInputProps extends ViewProps {
    numberOfDigits: number;
    value: string;
    isSuccess: SharedValue<boolean>;
    isError?: SharedValue<boolean>;
}

export const PasscodeInput = (props: PasscodeInputProps) => {
    const { numberOfDigits, value, isSuccess, isError } = props;
    const shakeX = useSharedValue(0);

    const shakeStyle = useAnimatedStyle(() => ({
        transform: [{ translateX: shakeX.value }]
    }));

    useAnimatedReaction(
        () => isError?.value,
        (error, prev) => {
            if (error && !prev) {
                shakeX.value = withSequence(
                    withTiming(8, { duration: 40 }),
                    withTiming(-8, { duration: 40 }),
                    withTiming(6, { duration: 40 }),
                    withTiming(-6, { duration: 40 }),
                    withTiming(0, { duration: 40 })
                );
            }
        }
    );

    return (
        <Animated.View style={[styles.container, shakeStyle]}>
            {Array.from({ length: numberOfDigits }).map((_, index) => (
                <Dot
                    key={index}
                    isFilled={index < value.length}
                    isSuccess={isSuccess}
                    isError={isError}
                />
            ))}
        </Animated.View>
    );
};
