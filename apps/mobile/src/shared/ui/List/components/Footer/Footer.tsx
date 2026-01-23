import { View, ViewProps } from 'react-native';

import { styles } from './Footer.styles';

export const Footer = (props: ViewProps) => {
    const { children, style, ...rest } = props;

    return (
        <View style={[styles.footer, style]} {...rest}>
            {children}
        </View>
    );
};
