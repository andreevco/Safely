import type { PressableProps, StyleProp, ViewStyle } from 'react-native';
import { Pressable } from 'react-native';
import type { UnistylesVariants } from 'react-native-unistyles';

import { Text } from '@mobile/shared/ui/Text';

import { styles } from './Button.styles';

type ButtonProps = Omit<PressableProps, 'style'> &
    UnistylesVariants<typeof styles> & { style?: StyleProp<ViewStyle> };

export const Button = (props: ButtonProps) => {
    const { children, type = 'primary', size = 'medium', disabled, style, ...rest } = props;

    styles.useVariants({ type, size, disabled });

    return (
        <Pressable
            style={({ pressed }) => [
                styles.container,
                pressed && !disabled && { opacity: 0.8 },
                style
            ]}
            disabled={disabled}
            {...rest}
        >
            {typeof children === 'string' ? (
                <Text variant={size === 'small' ? 'labelM' : 'labelL'} style={styles.text}>
                    {children}
                </Text>
            ) : (
                children
            )}
        </Pressable>
    );
};
