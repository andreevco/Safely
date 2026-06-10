import { Host } from '@expo/ui';
import { TextField as AndroidTextField, Text as AndroidText } from '@expo/ui/jetpack-compose';
import type { ObservableState, TextFieldColors } from '@expo/ui/jetpack-compose';
import type { TextFieldRef as AndroidTextFieldRef } from '@expo/ui/jetpack-compose';
import { TextField as IosTextField, Text as IosText } from '@expo/ui/swift-ui';
import type { TextFieldRef as IosTextFieldRef } from '@expo/ui/swift-ui';
import { foregroundStyle, frame } from '@expo/ui/swift-ui/modifiers';
import { useImperativeHandle, useRef, useState, type Ref } from 'react';
import { Platform, View } from 'react-native';
import { useUnistyles } from 'react-native-unistyles';

import { styles } from './NativeInput.styles';

export type NativeInputRef = {
    focus: () => void;
    blur: () => void;
};

type Selection = { start: number; end: number };

export type NativeInputProps = {
    ref?: Ref<NativeInputRef>;
    value: ObservableState<string>;
    selection?: ObservableState<Selection>;
    onChangeText?: (text: string) => void;
    onFocus?: () => void;
    onBlur?: () => void;
    placeholder?: string;
    error?: boolean;
    multiline?: boolean;
};

export const NativeInput = ({
    ref,
    value,
    selection,
    onChangeText,
    onFocus,
    onBlur,
    placeholder,
    error = false,
    multiline = false
}: NativeInputProps) => {
    const { theme } = useUnistyles();
    const [isFocused, setIsFocused] = useState(false);

    const textFieldRef = useRef<AndroidTextFieldRef | IosTextFieldRef>(null);
    useImperativeHandle(
        ref,
        () => ({
            focus: () => {
                void textFieldRef.current?.focus();
            },
            blur: () => {
                void textFieldRef.current?.blur();
            }
        }),
        []
    );

    const handleFocus = () => {
        setIsFocused(true);
        onFocus?.();
    };

    const handleBlur = () => {
        setIsFocused(false);
        onBlur?.();
    };

    styles.useVariants({ focused: isFocused && !error, error });

    const androidFieldColors = {
        focusedContainerColor: 'transparent',
        unfocusedContainerColor: 'transparent',
        disabledContainerColor: 'transparent',
        errorContainerColor: 'transparent',
        focusedIndicatorColor: 'transparent',
        unfocusedIndicatorColor: 'transparent',
        disabledIndicatorColor: 'transparent',
        errorIndicatorColor: 'transparent',
        focusedPlaceholderColor: theme.colors.text.tertiary,
        unfocusedPlaceholderColor: theme.colors.text.tertiary,
        disabledPlaceholderColor: theme.colors.text.tertiary,
        errorPlaceholderColor: theme.colors.text.tertiary
    } satisfies TextFieldColors;

    if (Platform.OS === 'android') {
        return (
            <View style={styles.container}>
                <Host matchContents={{ vertical: true }}>
                    <AndroidTextField
                        ref={textFieldRef}
                        value={value}
                        selection={selection}
                        onValueChange={onChangeText}
                        onFocusChanged={focused => {
                            if (focused) {
                                handleFocus();
                            } else {
                                handleBlur();
                            }
                        }}
                        textStyle={styles.text}
                        colors={androidFieldColors}
                        singleLine={!multiline}
                    >
                        {placeholder ? (
                            <AndroidTextField.Placeholder>
                                <AndroidText>{placeholder}</AndroidText>
                            </AndroidTextField.Placeholder>
                        ) : null}
                    </AndroidTextField>
                </Host>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Host style={styles.host}>
                <IosTextField
                    ref={textFieldRef}
                    text={value}
                    selection={selection}
                    onTextChange={onChangeText}
                    onFocusChange={focused => {
                        if (focused) {
                            handleFocus();
                        } else {
                            handleBlur();
                        }
                    }}
                    axis={multiline ? 'vertical' : 'horizontal'}
                    placeholder={placeholder}
                    modifiers={[frame({ maxHeight: Infinity, alignment: 'topLeading' })]}
                >
                    {placeholder ? (
                        <IosTextField.Placeholder>
                            <IosText modifiers={[foregroundStyle(theme.colors.text.tertiary)]}>
                                {placeholder}
                            </IosText>
                        </IosTextField.Placeholder>
                    ) : null}
                </IosTextField>
            </Host>
        </View>
    );
};
