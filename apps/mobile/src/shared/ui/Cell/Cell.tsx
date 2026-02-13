import { TouchableHighlight, TouchableHighlightProps, View } from 'react-native';

import { styles } from './Cell.styles';

export type CellContainerProps = TouchableHighlightProps;

export const CellContainer = (props: CellContainerProps) => {
    const { children, style, ...rest } = props;

    return (
        <TouchableHighlight {...rest}>
            <View style={[styles.container, style]}>{children}</View>
        </TouchableHighlight>
    );
};
