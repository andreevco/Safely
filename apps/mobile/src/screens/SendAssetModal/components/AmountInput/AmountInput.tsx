import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';
import { TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';
import Animated, { useSharedValue } from 'react-native-reanimated';
import { useUnistyles } from 'react-native-unistyles';

import { Icon, SwapVertical20 } from '@mobile/shared/ui/Icon';
import { Text } from '@mobile/shared/ui/Text';

import { styles, useInputAnimatedStyle } from './AmountInput.styles';
import { MaskedInput, type MaskedInputRef } from '../../../../../modules/safely-masked-input/src';

export type AmountInputProps = {
    decimals: number;
    decimalSeparator: string;
    value?: string;
    onChangeText?: (value: string) => void;
    label?: string;
    RightComponent?: React.ReactNode;
    onSwitchFiatMode?: () => void;
    formattedAlternativeAmount?: string;
    errored?: boolean;
    currencySymbol?: string;
    isMax?: boolean;
    placeholder?: string;
    onFocus?: () => void;
};

export const AmountInput = forwardRef<MaskedInputRef, AmountInputProps>((props, ref) => {
    const {
        label,
        errored,
        RightComponent,
        onSwitchFiatMode,
        decimals,
        decimalSeparator,
        value,
        onChangeText,
        formattedAlternativeAmount,
        currencySymbol,
        isMax,
        placeholder,
        onFocus
    } = props;
    const { theme } = useUnistyles();
    const inputRef = useRef<MaskedInputRef | null>(null);
    const focused = useSharedValue<boolean>(false);

    const inputStyle = useInputAnimatedStyle(focused, errored ?? false);

    const handleFocusChange = useCallback(
        (isFocused: boolean) => {
            focused.value = isFocused;
            if (isFocused) {
                onFocus?.();
            }
        },
        [focused, onFocus]
    );

    const handleChangeText = useCallback(
        (rawText: string, _formattedText: string) => {
            onChangeText?.(rawText);
        },
        [onChangeText]
    );

    useImperativeHandle(ref, () => inputRef.current as MaskedInputRef, []);

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
                                {isMax && (
                                    <Text variant="titleS" color="tertiary">
                                        ≈{' '}
                                    </Text>
                                )}
                                <MaskedInput
                                    ref={inputRef}
                                    decimals={decimals}
                                    decimalSeparator={decimalSeparator}
                                    value={value}
                                    onChangeText={handleChangeText}
                                    onFocusChange={handleFocusChange}
                                    placeholder={placeholder}
                                    placeholderTextColor={theme.colors.text.tertiary}
                                    textColor={theme.colors.text.primary}
                                    keyboardType="decimal-pad"
                                    fontSize={32}
                                    suffix={currencySymbol ?? ''}
                                    suffixColor={theme.colors.text.tertiary}
                                    suffixFontSize={14}
                                    style={styles.input}
                                />
                            </View>
                            <TouchableOpacity
                                activeOpacity={0.8}
                                onPress={onSwitchFiatMode}
                                style={styles.switchButton}
                            >
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
