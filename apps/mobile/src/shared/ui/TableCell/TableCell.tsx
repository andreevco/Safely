import { TouchableHighlight, View, ViewStyle } from 'react-native';

import { styles } from './TableCell.styles';

export type TableCellContainerProps = {
    children: React.ReactNode;
    style?: ViewStyle;
    onPress?: () => void;
};

export const TableCellContainer = (props: TableCellContainerProps) => {
    const { children, style, onPress } = props;

    return (
        <TouchableHighlight onPress={onPress}>
            <View style={[styles.container, style]}>{children}</View>
        </TouchableHighlight>
    );
};
