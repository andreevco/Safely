import type { ForwardedRef } from 'react';
import { forwardRef, useCallback, useRef } from 'react';
import type { ViewProps } from 'react-native';
import { TextInput, TouchableWithoutFeedback } from 'react-native';
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
    onChange: (value: string) => void;
    isSuccess: SharedValue<boolean>;
    isError?: SharedValue<boolean>;
}

export const PasscodeInput = forwardRef(
    (props: PasscodeInputProps, ref: ForwardedRef<TextInput>) => {
        const { numberOfDigits, value, onChange, isSuccess, isError } = props;
        const textInputRef = useRef<TextInput>(null);
        const shakeX = useSharedValue(0);

        const setRefs = useCallback(
            (node: TextInput | null) => {
                textInputRef.current = node;

                if (typeof ref === 'function') {
                    ref(node);
                } else if (ref) {
                    (ref as React.MutableRefObject<TextInput | null>).current = node;
                }
            },
            [ref]
        );

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
            <TouchableWithoutFeedback onPress={() => textInputRef.current?.focus()}>
                <Animated.View style={[styles.container, shakeStyle]}>
                    {Array.from({ length: numberOfDigits }).map((_, index) => (
                        <Dot
                            key={index}
                            isFilled={index < value.length}
                            isSuccess={isSuccess}
                            isError={isError}
                        />
                    ))}
                    <TextInput
                        ref={setRefs}
                        style={styles.hiddenInput}
                        value={value}
                        onChangeText={onChange}
                        maxLength={numberOfDigits}
                        keyboardType="number-pad"
                        textAlign="center"
                        inputMode="numeric"
                        autoFocus
                        showSoftInputOnFocus
                        caretHidden
                        contextMenuHidden
                        selectTextOnFocus={false}
                    />
                </Animated.View>
            </TouchableWithoutFeedback>
        );
    }
);
