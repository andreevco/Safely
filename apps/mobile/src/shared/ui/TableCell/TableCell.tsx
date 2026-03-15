import { TouchableHighlight, View, ViewStyle } from 'react-native';
import { useUnistyles } from 'react-native-unistyles';

import { styles } from './TableCell.styles';

export type TableCellContainerProps = {
    children: React.ReactNode;
    style?: ViewStyle;
    showDivider?: boolean;
    onPress?: () => void;
};

export const TableCellContainer = (props: TableCellContainerProps) => {
    const { children, style, onPress, showDivider = true } = props;

    const theme = useUnistyles().theme;

    styles.useVariants({ showDivider });

    return (
        <TouchableHighlight
            style={styles.touchable}
            underlayColor={theme.colors.other.hover}
            onPress={onPress}
        >
            <View style={[styles.container, style]}>{children}</View>
        </TouchableHighlight>
    );
};
