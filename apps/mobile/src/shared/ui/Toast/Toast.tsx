import React from 'react';
import { Pressable, type PressableProps, type StyleProp, View, type ViewStyle } from 'react-native';

import { Text } from '../Text';
import { styles } from './Toast.styles';

export type ToastProps = {
    message: string;
    style?: StyleProp<ViewStyle>;
} & Omit<PressableProps, 'style'>;

export const Toast = ({ message, style, ...pressableProps }: ToastProps) => (
    <Pressable {...pressableProps}>
        <View style={[styles.container, style]}>
            <Text variant="labelM" textAlign="center" numberOfLines={1}>
                {message}
            </Text>
        </View>
    </Pressable>
);
