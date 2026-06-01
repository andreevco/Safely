import type { ViewProps } from 'react-native';
import { View } from 'react-native';

import { styles } from './Row.styles';

export const Row = (props: ViewProps) => {
    const { children, style, ...rest } = props;

    return (
        <View style={[styles.container, style]} {...rest}>
            {children}
        </View>
    );
};
