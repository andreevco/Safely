import { View, ViewProps } from 'react-native';

import { styles } from './CellRow.styles';

export const CellRow = (props: ViewProps) => {
    const { children, style, ...rest } = props;

    return (
        <View style={[styles.container, style]} {...rest}>
            {children}
        </View>
    );
};
