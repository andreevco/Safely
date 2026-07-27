import type { ReactNode } from 'react';
import type { PressableProps, StyleProp, ViewStyle } from 'react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import type { UnistylesVariants } from 'react-native-unistyles';

import { CircularSpinner } from '@mobile/shared/ui/CircularSpinner';
import type { TextProps } from '@mobile/shared/ui/Text';
import { Text } from '@mobile/shared/ui/Text';

import { styles } from './Button.styles';

type ButtonProps = Omit<PressableProps, 'style' | 'children'> &
    UnistylesVariants<typeof styles> & {
        style?: StyleProp<ViewStyle>;
        isLoading?: boolean;
        children?: ReactNode;
        textProps?: Omit<TextProps, 'children'>;
    };

const SPINNER_SIZE_BY_BUTTON_SIZE = {
    small: 20,
    medium: 24,
    large: 28
};

export const Button = (props: ButtonProps) => {
    const {
        children,
        type = 'primary',
        size = 'medium',
        disabled,
        isLoading,
        style,
        textProps,
        ...rest
    } = props;

    const isDisabled = disabled || isLoading;
    styles.useVariants({ type, size, disabled: isDisabled });

    return (
        <Pressable
            style={({ pressed }) => [
                styles.container,
                pressed && !isDisabled && { opacity: 0.8 },
                style
            ]}
            disabled={isDisabled}
            {...rest}
        >
            <View style={{ opacity: isLoading ? 0 : 1 }}>
                {typeof children === 'string' ? (
                    <Text
                        variant={size === 'small' ? 'labelM' : 'labelL'}
                        {...textProps}
                        style={[styles.text, textProps?.style]}
                    >
                        {children}
                    </Text>
                ) : (
                    children
                )}
            </View>

            {isLoading && (
                <View
                    style={[
                        StyleSheet.absoluteFill,
                        { alignItems: 'center', justifyContent: 'center' }
                    ]}
                >
                    <CircularSpinner size={SPINNER_SIZE_BY_BUTTON_SIZE[size]} />
                </View>
            )}
        </Pressable>
    );
};
