import type { ViewProps } from 'react-native';
import { View } from 'react-native';

export const ListContainer = (props: ViewProps) => {
    const { children, ...rest } = props;

    return <View {...rest}>{children}</View>;
};
