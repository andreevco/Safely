import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import type { StyleProp, TextInputProps, ViewStyle } from 'react-native';
import { TextInput, View, TouchableWithoutFeedback } from 'react-native';
import Animated, {
    interpolateColor,
    useAnimatedStyle,
    useSharedValue,
    withTiming
} from 'react-native-reanimated';
import { useUnistyles } from 'react-native-unistyles';

import { Icon, XmarkCircle16 } from '@mobile/shared/ui/Icon';
import { TouchableOpacity } from '@mobile/shared/ui/TouchableOpacity';

import { styles } from './Field.styles';

type InputFieldProps = TextInputProps & {
    containerStyle?: StyleProp<ViewStyle>;
    errored?: boolean;
    withClearButton?: boolean;
};

type FocusHandler = NonNullable<TextInputProps['onFocus']>;
type BlurHandler = NonNullable<TextInputProps['onBlur']>;

const ANIMATION_DURATION = 150;

export const InputField = forwardRef<TextInput, InputFieldProps>((props, ref) => {
    const {
        containerStyle,
        errored = false,
        withClearButton = false,
        onFocus,
        onBlur,
        onChangeText,
        value,
        style,
        ...rest
    } = props;
    const { theme } = useUnistyles();

    const inputRef = useRef<TextInput>(null);
    useImperativeHandle(ref, () => inputRef.current as TextInput, []);

    const handleContainerPress = useCallback(() => {
        inputRef.current?.focus();
    }, []);

    const [isFocused, setIsFocused] = useState(false);

    const handleFocus = useCallback<FocusHandler>(
        event => {
            setIsFocused(true);
            onFocus?.(event);
        },
        [onFocus]
    );

    const handleBlur = useCallback<BlurHandler>(
        event => {
            setIsFocused(false);
            onBlur?.(event);
        },
        [onBlur]
    );

    const handleClear = useCallback(() => {
        onChangeText?.('');
    }, [onChangeText]);

    const progress = useSharedValue(0);

    useEffect(() => {
        const target = errored ? 2 : isFocused ? 1 : 0;
        progress.value = withTiming(target, { duration: ANIMATION_DURATION });
    }, [isFocused, errored, progress]);

    const animatedStyle = useAnimatedStyle(() => ({
        borderColor: interpolateColor(
            progress.value,
            [0, 1, 2],
            [
                theme.colors.background.tertiary,
                theme.colors.input.focused.border,
                theme.colors.input.error.border
            ]
        )
    }));

    const hasValue = !!value && value.length > 0;
    const clearOpacity = useSharedValue(0);

    useEffect(() => {
        clearOpacity.value = withTiming(hasValue ? 1 : 0, { duration: ANIMATION_DURATION });
    }, [hasValue, clearOpacity]);

    const clearButtonStyle = useAnimatedStyle(() => ({
        opacity: clearOpacity.value
    }));

    return (
        <View style={styles.wrapper}>
            <TouchableWithoutFeedback onPress={handleContainerPress}>
                <Animated.View style={[styles.container, animatedStyle, containerStyle]}>
                    <TextInput
                        ref={inputRef}
                        value={value}
                        placeholderTextColor={theme.colors.text.tertiary}
                        onChangeText={onChangeText}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        style={[styles.input, style]}
                        {...rest}
                    />
                    {withClearButton && (
                        <Animated.View style={[styles.clearButton, clearButtonStyle]}>
                            <TouchableOpacity
                                hitSlop={12}
                                onPress={handleClear}
                                disabled={!hasValue}
                            >
                                <Icon icon={XmarkCircle16} color="tertiary" />
                            </TouchableOpacity>
                        </Animated.View>
                    )}
                </Animated.View>
            </TouchableWithoutFeedback>
        </View>
    );
});
