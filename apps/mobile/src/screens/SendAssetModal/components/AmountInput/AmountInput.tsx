import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';
import { TextInputProps, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import { MaskedTextInput, MaskedTextInputRef } from 'react-native-advanced-input-mask';
import Animated, { useSharedValue } from 'react-native-reanimated';
import { useUnistyles } from 'react-native-unistyles';

import { Icon, SwapVertical20 } from '@mobile/shared/ui/Icon';
import { Text } from '@mobile/shared/ui/Text';

import { styles, useInputAnimatedStyle } from './AmountInput.styles';

export type AmountInputProps = TextInputProps & {
    label?: string;
    RightComponent?: React.ReactNode;
    onSwitchFiatMode?: () => void;
    formattedAlternativeAmount?: string;
    errored?: boolean;
    currencySymbol?: string;
    mask: string;
};

export const AmountInput = forwardRef<MaskedTextInputRef, AmountInputProps>((props, ref) => {
    const {
        label,
        style,
        errored,
        RightComponent,
        onSwitchFiatMode,
        mask,
        formattedAlternativeAmount,
        currencySymbol,
        ...rest
    } = props;
    const { theme } = useUnistyles();
    const inputRef = useRef<MaskedTextInputRef | null>(null);
    const focused = useSharedValue<boolean>(false);

    const inputStyle = useInputAnimatedStyle(focused, errored ?? false);

    const updateFocused = useCallback(
        (value: boolean) => () => {
            focused.value = value;
        },
        [focused]
    );

    useImperativeHandle(ref, () => inputRef.current as MaskedTextInputRef, []);

    return (
        <View>
            {label && (
                <View style={styles.labelContainer}>
                    <Text variant="bodyM" color="tertiary">
                        {label}
                    </Text>
                </View>
            )}
            <View style={styles.inputPaddingContainer}>
                <TouchableWithoutFeedback onPress={() => inputRef.current?.focus()}>
                    <Animated.View style={[styles.inputContainer, inputStyle]}>
                        <View style={styles.leftContentContainer}>
                            <View style={styles.textInputWithCurrencySymbolContainer}>
                                <MaskedTextInput
                                    mask={mask}
                                    ref={inputRef}
                                    placeholderTextColor={theme.colors.text.tertiary}
                                    keyboardType="numeric"
                                    onFocus={updateFocused(true)}
                                    onBlur={updateFocused(false)}
                                    style={[styles.input, style]}
                                    {...rest}
                                />
                                {currencySymbol && (
                                    <Text variant="bodyM" color="tertiary">
                                        {currencySymbol}
                                    </Text>
                                )}
                            </View>
                            <TouchableOpacity activeOpacity={0.8} onPress={onSwitchFiatMode}>
                                <Animated.View style={styles.secondaryCurrencyContainer}>
                                    <Text variant="bodyM" color="tertiary" monospace>
                                        {formattedAlternativeAmount ?? '0'}
                                    </Text>
                                    <Icon icon={SwapVertical20} color="secondary" />
                                </Animated.View>
                            </TouchableOpacity>
                        </View>
                        {RightComponent && (
                            <View style={styles.rightContentContainer}>{RightComponent}</View>
                        )}
                    </Animated.View>
                </TouchableWithoutFeedback>
            </View>
        </View>
    );
});
