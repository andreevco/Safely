import React from 'react';
import { Pressable, type PressableProps, type StyleProp, View, type ViewStyle } from 'react-native';
import type { UnistylesVariants } from 'react-native-unistyles';

import { Text } from '../Text';
import { styles } from './Toast.styles';

export type ToastProps = UnistylesVariants<typeof styles> & {
    message: string;
    style?: StyleProp<ViewStyle>;
} & Omit<PressableProps, 'style'>;

export const Toast = ({ message, style, variant, ...pressableProps }: ToastProps) => {
    styles.useVariants({ variant });

    return (
        <Pressable hitSlop={8} {...pressableProps}>
            <View style={[styles.container, style]}>
                <Text
                    variant="labelM"
                    textAlign="center"
                    numberOfLines={4}
                    color={variant === 'white' ? 'constantBlack' : undefined}
                >
                    {message}
                </Text>
            </View>
        </Pressable>
    );
};
