import { Text } from '@mobile/shared/ui/Text';
import { TouchableOpacity } from '@mobile/shared/ui/TouchableOpacity';
import { TouchableOpacityProps } from 'react-native';
import { UnistylesVariants } from 'react-native-unistyles';

import { styles } from './Button.styles';

type ButtonProps = TouchableOpacityProps & UnistylesVariants<typeof styles>;

export const Button = (props: ButtonProps) => {
    const { children, type = 'primary', size = 'medium', ...rest } = props;

    styles.useVariants({ type, size });

    return (
        <TouchableOpacity {...rest}>
            {typeof children === 'string' ? (
                <Text variant={size === 'small' ? 'labelM' : 'labelL'}>{children}</Text>
            ) : (
                children
            )}
        </TouchableOpacity>
    );
};
