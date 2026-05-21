import type { ViewProps } from 'react-native';
import { View } from 'react-native';

import { styles } from './Content.styles';

export const Content = (props: ViewProps) => {
    const { children, style, ...rest } = props;

    return (
        <View style={[styles.container, style]} {...rest}>
            {children}
        </View>
    );
};
