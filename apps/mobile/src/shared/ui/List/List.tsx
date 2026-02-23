import { View, ViewProps } from 'react-native';

export const ListContainer = (props: ViewProps) => {
    const { children, ...rest } = props;

    return <View {...rest}>{children}</View>;
};
