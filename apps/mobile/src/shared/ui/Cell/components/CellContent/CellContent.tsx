import { View, ViewProps } from 'react-native';

import { styles } from './CellContent.styles';

export const CellContent = (props: ViewProps) => {
    const { children, style, ...rest } = props;

    return (
        <View style={[styles.container, style]} {...rest}>
            {children}
        </View>
    );
};
