import { TouchableHighlight, TouchableHighlightProps, View } from 'react-native';
import { useUnistyles } from 'react-native-unistyles';

import { styles } from './Cell.styles';

export type CellContainerProps = TouchableHighlightProps;

export const CellContainer = (props: CellContainerProps) => {
    const { children, style, ...rest } = props;

    const theme = useUnistyles().theme;

    return (
        <TouchableHighlight underlayColor={theme.colors.other.hover} {...rest}>
            <View style={[styles.container, style]}>{children}</View>
        </TouchableHighlight>
    );
};
