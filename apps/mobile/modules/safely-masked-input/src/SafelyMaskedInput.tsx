import Color from 'color';
import { requireNativeModule, requireNativeViewManager } from 'expo-modules-core';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';
import { StyleProp, ViewStyle } from 'react-native';

interface SafelyMaskedInputNativeModule {
    focus: (tag: number) => void;
    blur: (tag: number) => void;
    setText: (tag: number, text: string) => void;
    setCursorPosition: (tag: number, position: number) => void;
}

const NativeModule: SafelyMaskedInputNativeModule = requireNativeModule('SafelyMaskedInput');
const NativeView = requireNativeViewManager('SafelyMaskedInput');

export interface SafelyMaskedInputRef {
    focus: () => void;
    blur: () => void;
    setText: (text: string) => void;
    setCursorPosition: (position: number) => void;
}

export interface SafelyMaskedInputProps {
    decimals: number;
    decimalSeparator: string;
    value?: string;
    onChangeText?: (rawText: string, formattedText: string) => void;
    onFocusChange?: (focused: boolean) => void;
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: string;
    textColor?: string;
    placeholder?: string;
    placeholderTextColor?: string;
    keyboardType?: 'numeric' | 'decimal-pad' | 'default';
    editable?: boolean;
    autoFocus?: boolean;
    integerColor?: string;
    integerOpacity?: number;
    decimalColor?: string;
    decimalOpacity?: number;
    placeholderDigitColor?: string;
    placeholderDigitOpacity?: number;
    suffix?: string;
    suffixColor?: string;
    suffixOpacity?: number;
    suffixFontSize?: number;
    style?: StyleProp<ViewStyle>;
}

interface NativeChangeEvent {
    nativeEvent: { rawText: string; formattedText: string };
}

interface NativeFocusEvent {
    nativeEvent: { focused: boolean };
}

function toHex(value: string | undefined): string | undefined {
    if (!value) return undefined;
    try {
        return Color(value).hex();
    } catch {
        return value;
    }
}

export const SafelyMaskedInput = forwardRef<SafelyMaskedInputRef, SafelyMaskedInputProps>(
    (props, ref) => {
        const {
            onChangeText,
            onFocusChange,
            textColor,
            placeholderTextColor,
            integerColor,
            decimalColor,
            placeholderDigitColor,
            suffixColor,
            ...rest
        } = props;
        const nativeRef = useRef<{ nativeTag?: number }>(null);

        const getTag = useCallback(() => nativeRef.current?.nativeTag ?? -1, []);

        useImperativeHandle(ref, () => ({
            focus: () => NativeModule.focus(getTag()),
            blur: () => NativeModule.blur(getTag()),
            setText: (text: string) => NativeModule.setText(getTag(), text),
            setCursorPosition: (pos: number) => NativeModule.setCursorPosition(getTag(), pos)
        }));

        const handleChangeText = useCallback(
            (e: NativeChangeEvent) =>
                onChangeText?.(e.nativeEvent.rawText, e.nativeEvent.formattedText),
            [onChangeText]
        );

        const handleFocusChange = useCallback(
            (e: NativeFocusEvent) => onFocusChange?.(e.nativeEvent.focused),
            [onFocusChange]
        );

        return (
            <NativeView
                ref={nativeRef}
                {...rest}
                textColor={toHex(textColor)}
                placeholderTextColor={toHex(placeholderTextColor)}
                integerColor={toHex(integerColor)}
                decimalColor={toHex(decimalColor)}
                placeholderDigitColor={toHex(placeholderDigitColor)}
                suffixColor={toHex(suffixColor)}
                onChangeText={handleChangeText}
                onFocusChange={handleFocusChange}
            />
        );
    }
);
