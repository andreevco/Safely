import Color from 'color';
import { requireNativeModule, requireNativeViewManager } from 'expo-modules-core';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';
import { StyleProp, ViewStyle } from 'react-native';

interface MaskedInputNativeModule {
    focus: (tag: number) => void;
    blur: (tag: number) => void;
    setText: (tag: number, text: string) => void;
    setCursorPosition: (tag: number, position: number) => void;
}

const NativeModule: MaskedInputNativeModule = requireNativeModule('SafelyMaskedInput');
const NativeView = requireNativeViewManager('SafelyMaskedInput');

export interface MaskedInputRef {
    focus: () => void;
    blur: () => void;
    setText: (text: string) => void;
    setCursorPosition: (position: number) => void;
}

export interface MaskedInputProps {
    decimals: number;
    decimalSeparator: string;
    value?: string;
    onChangeText?: (rawText: string, formattedText: string) => void;
    onFocusChange?: (focused: boolean) => void;
    onPaste?: (raw: string) => void;
    fontSize?: number;
    fontFamily?: string;
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
    testID?: string;
}

interface NativeChangeEvent {
    nativeEvent: { rawText: string; formattedText: string; eventCount: number };
}

interface NativeFocusEvent {
    nativeEvent: { focused: boolean };
}

interface NativePasteEvent {
    nativeEvent: { raw: string };
}

function toHex(value: string | undefined): string | undefined {
    if (!value) return undefined;
    try {
        return Color(value).hex();
    } catch {
        return value;
    }
}

export const MaskedInput = forwardRef<MaskedInputRef, MaskedInputProps>((props, ref) => {
    const {
        onChangeText,
        onFocusChange,
        onPaste,
        textColor,
        placeholderTextColor,
        integerColor,
        decimalColor,
        placeholderDigitColor,
        suffixColor,
        placeholder,
        suffix,
        value,
        ...rest
    } = props;
    const nativeRef = useRef<{ nativeTag?: number }>(null);
    const eventCountRef = useRef(0);

    const getTag = useCallback(() => nativeRef.current?.nativeTag ?? -1, []);

    useImperativeHandle(ref, () => ({
        focus: () => NativeModule.focus(getTag()),
        blur: () => NativeModule.blur(getTag()),
        setText: (text: string) => NativeModule.setText(getTag(), text),
        setCursorPosition: (pos: number) => NativeModule.setCursorPosition(getTag(), pos)
    }));

    const handleChangeText = useCallback(
        (e: NativeChangeEvent) => {
            const { rawText, formattedText, eventCount } = e.nativeEvent;

            eventCountRef.current = eventCount;
            onChangeText?.(rawText, formattedText);
        },
        [onChangeText]
    );

    const handleFocusChange = useCallback(
        (e: NativeFocusEvent) => onFocusChange?.(e.nativeEvent.focused),
        [onFocusChange]
    );

    const handlePaste = useCallback(
        (e: NativePasteEvent) => onPaste?.(e.nativeEvent.raw),
        [onPaste]
    );

    return (
        <NativeView
            ref={nativeRef}
            {...rest}
            value={{ text: value ?? null, eventCount: eventCountRef.current }}
            placeholder={placeholder ?? ''}
            suffix={suffix ?? ''}
            textColor={toHex(textColor)}
            placeholderTextColor={toHex(placeholderTextColor)}
            integerColor={toHex(integerColor)}
            decimalColor={toHex(decimalColor)}
            placeholderDigitColor={toHex(placeholderDigitColor)}
            suffixColor={toHex(suffixColor)}
            onChangeText={handleChangeText}
            onFocusChange={handleFocusChange}
            onPaste={handlePaste}
        />
    );
});
