import { View, ViewStyle } from 'react-native';

import { styles } from './Cell.styles';

export type CellContainerProps = {
    children: React.ReactNode;
    style?: ViewStyle;
};

export const CellContainer = (props: CellContainerProps) => {
    const { children, style } = props;

    return <View style={[styles.container, style]}>{children}</View>;
};
