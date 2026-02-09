import { TouchableOpacity } from '@mobile/shared/ui/TouchableOpacity';
import { TouchableOpacityProps, View } from 'react-native';
import { UnistylesVariants } from 'react-native-unistyles';

import { styles } from './Button.styles';

type ButtonProps = TouchableOpacityProps & UnistylesVariants<typeof styles>;

export const Button = (props: ButtonProps) => {
    const { children, type = 'rounded', ...rest } = props;

    styles.useVariants({ type });

    return (
        <View style={styles.container}>
            <TouchableOpacity hitSlop={12} style={styles.button} {...rest}>
                {children}
            </TouchableOpacity>
        </View>
    );
};
