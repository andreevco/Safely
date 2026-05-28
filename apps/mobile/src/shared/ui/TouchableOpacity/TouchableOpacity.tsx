import { forwardRef } from 'react';
import type { TouchableOpacityProps, View } from 'react-native';
import { TouchableOpacity as RNTouchableOpacity } from 'react-native';

/**
 * TouchableOpacity with configured active opacity
 */
export const TouchableOpacity = forwardRef<View, TouchableOpacityProps>((props, ref) => {
    const { children, ...rest } = props;

    return (
        <RNTouchableOpacity ref={ref} activeOpacity={0.8} {...rest}>
            {children}
        </RNTouchableOpacity>
    );
});
