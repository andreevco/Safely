import Color from 'color';
import { requireNativeModule, requireNativeViewManager } from 'expo-modules-core';
import { forwardRef, useCallback, useImperativeHandle, useRef } from 'react';
import { StyleProp, ViewStyle } from 'react-native';

interface SeedPhraseInputNativeModule {
    focus: (tag: number) => void;
    blur: (tag: number) => void;
}

const NativeModule: SeedPhraseInputNativeModule = requireNativeModule('SafelySeedPhraseInput');
const NativeView = requireNativeViewManager('SafelySeedPhraseInput');

export interface SeedPhraseInputRef {
    focus: () => void;
    blur: () => void;
}

export interface SeedPhraseInputProps {
    value?: string;
    onChangeText?: (text: string) => void;
    onFocusChange?: (focused: boolean) => void;
    placeholder?: string;
    placeholderTextColor?: string;
    textColor?: string;
    fontSize?: number;
    fontFamily?: string;
    autoFocus?: boolean;
    editable?: boolean;
    style?: StyleProp<ViewStyle>;
}

interface NativeChangeEvent {
    nativeEvent: { text: string };
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

export const SeedPhraseInput = forwardRef<SeedPhraseInputRef, SeedPhraseInputProps>(
    (props, ref) => {
        const { onChangeText, onFocusChange, textColor, placeholderTextColor, ...rest } = props;
        const nativeRef = useRef<{ nativeTag?: number }>(null);

        const getTag = useCallback(() => nativeRef.current?.nativeTag ?? -1, []);

        useImperativeHandle(ref, () => ({
            focus: () => NativeModule.focus(getTag()),
            blur: () => NativeModule.blur(getTag())
        }));

        const handleChangeText = useCallback(
            (e: NativeChangeEvent) => onChangeText?.(e.nativeEvent.text),
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
                onChangeText={handleChangeText}
                onFocusChange={handleFocusChange}
            />
        );
    }
);
