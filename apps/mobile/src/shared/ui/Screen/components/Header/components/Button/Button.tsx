import { TouchableOpacity } from '@mobile/shared/ui/TouchableOpacity';
import { TouchableOpacityProps, View } from 'react-native';

import { styles } from './Button.styles';

type ButtonProps = TouchableOpacityProps;

export const Button = (props: ButtonProps) => {
    const { children, ...rest } = props;

    return (
        <View style={styles.container}>
            <TouchableOpacity style={styles.button} {...rest}>
                {children}
            </TouchableOpacity>
        </View>
    );
};
