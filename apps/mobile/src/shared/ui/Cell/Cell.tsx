import { TouchableHighlight, View, ViewStyle } from 'react-native';

import { styles } from './Cell.styles';

export type CellContainerProps = {
    children: React.ReactNode;
    style?: ViewStyle;
    onPress?: () => void;
};

export const CellContainer = (props: CellContainerProps) => {
    const { children, style, onPress } = props;

    return (
        <TouchableHighlight onPress={onPress}>
            <View style={[styles.container, style]}>{children}</View>
        </TouchableHighlight>
    );
};
