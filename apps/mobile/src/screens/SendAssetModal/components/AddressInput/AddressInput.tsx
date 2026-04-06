import { Ref, useCallback, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Keyboard, Pressable, TextInput, View } from 'react-native';
import Animated, {
    useAnimatedStyle,
    useSharedValue,
    Easing,
    withDelay,
    withRepeat,
    withSequence,
    withTiming
} from 'react-native-reanimated';
import { useUnistyles } from 'react-native-unistyles';

import { PortfolioMeta, ellipsisMiddle } from '@safely/core';
import { useScanQrScheme } from '@safely/ux';

import { PortfolioName } from '@mobile/entities/portfolio';
import { Icon, QrCodeScan28, XmarkCircle16 } from '@mobile/shared/ui/Icon';
import { Text } from '@mobile/shared/ui/Text';
import { TouchableOpacity } from '@mobile/shared/ui/TouchableOpacity';

import { styles } from './AddressInput.styles';

interface AddressInputProps {
    value: string;
    onChangeText: (value: string) => void;
    error?: string;
    label?: string;
    placeholder?: string;
    inputRef?: Ref<TextInput>;
    selectedMeta?: PortfolioMeta;
    onSubmitEditing?: () => void;
}

export const AddressInput = (props: AddressInputProps) => {
    const {
        value,
        onChangeText,
        error,
        label,
        placeholder,
        inputRef,
        selectedMeta,
        onSubmitEditing
    } = props;
    const { t } = useTranslation();
    const { theme } = useUnistyles();

    const fallbackRef = useRef<TextInput>(null);
    const textInputRef = (inputRef as React.RefObject<TextInput>) ?? fallbackRef;

    const scan = useScanQrScheme({
        allowedSchemes: ['btc-transfer'] as const,
        onResult: useCallback(
            scheme => {
                onChangeText(scheme.parsed.address);
            },
            [onChangeText]
        )
    });

    const handleScan = useCallback(() => {
        Keyboard.dismiss();
        scan();
    }, [scan]);

    const [isFocused, setIsFocused] = useState(false);

    const hasValue = value.length > 0;
    const hasError = !!error;

    styles.useVariants({
        focused: isFocused && !hasError,
        error: hasError
    });

    const handleFocus = useCallback(() => {
        setIsFocused(true);
    }, []);

    const handleBlur = useCallback(() => {
        setIsFocused(false);
    }, []);

    const handleClear = useCallback(() => {
        onChangeText('');
    }, [onChangeText]);

    const handleSelectedPress = useCallback(() => {
        textInputRef.current?.focus();
    }, [textInputRef]);

    return (
        <View>
            {label && (
                <View style={styles.labelContainer}>
                    <Text variant="bodyM" color="tertiary">
                        {label}
                    </Text>
                </View>
            )}
            <View style={styles.container}>
                <TextInput
                    ref={textInputRef}
                    value={value}
                    onChangeText={onChangeText}
                    onFocus={handleFocus}
                    onBlur={handleBlur}
                    style={[styles.input, selectedMeta && styles.hiddenInput]}
                    placeholder={placeholder}
                    placeholderTextColor={theme.colors.text.tertiary}
                    autoCapitalize="none"
                    autoCorrect={false}
                    spellCheck={false}
                    multiline
                    submitBehavior="submit"
                    returnKeyType="next"
                    onSubmitEditing={onSubmitEditing}
                />
                {selectedMeta && (
                    <Pressable style={styles.selectedContent} onPress={handleSelectedPress}>
                        <PortfolioName gap={8} meta={selectedMeta} size={16} fontVariant="bodyL" />
                        <BlinkingCursor color={theme.colors.accent.blue} />
                        <Text variant="bodyL" color="tertiary">
                            {ellipsisMiddle(value)}
                        </Text>
                    </Pressable>
                )}

                <TouchableOpacity
                    style={styles.iconButton}
                    onPress={hasValue ? handleClear : handleScan}
                >
                    {hasValue ? (
                        <Icon icon={XmarkCircle16} color="tertiary" />
                    ) : (
                        <Icon icon={QrCodeScan28} color="accent" />
                    )}
                </TouchableOpacity>
            </View>

            {hasError && <Text style={styles.errorText}>{t(error)}</Text>}
        </View>
    );
};

function BlinkingCursor({ color }: { color: string }) {
    const opacity = useSharedValue(1);

    opacity.value = withRepeat(
        withSequence(
            withDelay(500, withTiming(0, { duration: 100, easing: Easing.inOut(Easing.ease) })),
            withDelay(500, withTiming(1, { duration: 100, easing: Easing.inOut(Easing.ease) }))
        ),
        Infinity
    );

    const animatedStyle = useAnimatedStyle(() => ({
        opacity: opacity.value
    }));

    return (
        <Animated.View style={[styles.selectedCursor, { backgroundColor: color }, animatedStyle]} />
    );
}
