import { Children, type ReactNode, useMemo } from 'react';
import { View, ViewProps } from 'react-native';
import { UnistylesVariants } from 'react-native-unistyles';

import { styles } from './Group.styles';

export type GroupProps = ViewProps & UnistylesVariants<typeof styles>;

export const Group = (props: GroupProps) => {
    const { children, style, variant = 'divided', ...rest } = props;

    styles.useVariants({ variant });

    const content = useMemo(() => {
        const items = Children.toArray(children);

        if (variant !== 'separated') {
            return items;
        }

        return items.reduce<ReactNode[]>((acc, child, index) => {
            acc.push(child);
            if (index < items.length - 1) {
                acc.push(<View key={`divider-${index}`} style={styles.divider} />);
            }
            return acc;
        }, []);
    }, [children, variant]);

    return (
        <View style={[styles.group, style]} {...rest}>
            {content}
        </View>
    );
};
