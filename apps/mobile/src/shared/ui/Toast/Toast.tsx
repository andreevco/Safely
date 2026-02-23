import React from 'react';
import { Pressable, PressableProps, StyleProp, View, ViewStyle } from 'react-native';

import { Text } from '../Text';
import { styles } from './Toast.styles';

export type ToastProps = Omit<PressableProps, 'style'> & {
    message: string;
    style?: StyleProp<ViewStyle>;
};

export const Toast = (props: ToastProps) => {
    const { message, style, ...rest } = props;

    return (
        <Pressable {...rest}>
            <View style={[styles.container, style]}>
                <Text variant="labelM" textAlign="center" numberOfLines={1}>
                    {message}
                </Text>
            </View>
        </Pressable>
    );
};
