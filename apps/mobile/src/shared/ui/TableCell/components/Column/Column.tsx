import type { ViewProps } from 'react-native';
import { View } from 'react-native';
import type { UnistylesVariants } from 'react-native-unistyles';

import { styles } from './Column.styles';

type ColumnProps = ViewProps & UnistylesVariants<typeof styles>;

export const Column = (props: ColumnProps) => {
    const { children, style, leading, ...rest } = props;

    styles.useVariants({ leading });

    return (
        <View style={[styles.container, style]} {...rest}>
            {children}
        </View>
    );
};
