import { TouchableOpacity as RNTouchableOpacity, TouchableOpacityProps } from 'react-native';

/**
 * TouchableOpacity with configured active opacity
 */
export const TouchableOpacity = (props: TouchableOpacityProps) => {
    const { children, ...rest } = props;

    return (
        <RNTouchableOpacity activeOpacity={0.8} {...rest}>
            {children}
        </RNTouchableOpacity>
    );
};
