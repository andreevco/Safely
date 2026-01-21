import { View, ViewStyle } from 'react-native';

import { styles } from './Actions.styles';

export type ActionsContainerProps = {
    children: React.ReactNode;
    style?: ViewStyle;
};

export const ActionsContainer = (props: ActionsContainerProps) => {
    const { children, style } = props;

    return <View style={[styles.container, style]}>{children}</View>;
};
