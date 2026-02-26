import { Children, type ReactNode, useMemo } from 'react';
import { View, ViewProps } from 'react-native';
import { UnistylesVariants } from 'react-native-unistyles';

import { styles } from './Group.styles';

export type GroupProps = ViewProps &
    UnistylesVariants<typeof styles> & {
        withoutBottomMargin?: boolean;
    };

export const Group = (props: GroupProps) => {
    const { children, style, variant = 'divided', withoutBottomMargin, ...rest } = props;

    styles.useVariants({ variant, withoutBottomMargin });

    const content = useMemo(() => {
        const items = Children.toArray(children).filter(child => !!child);

        switch (variant) {
            case 'divided':
                return items.reduce<ReactNode[]>((acc, child, index) => {
                    acc.push(child);
                    if (index < items.length - 1) {
                        acc.push(<View key={`divider-${index}`} style={styles.divider} />);
                    }
                    return acc;
                }, []);
            case 'separated':
                return items.map((child, index) => {
                    return (
                        <View style={styles.separatedContainer} key={`item-${index}`}>
                            {child}
                        </View>
                    );
                });
            default:
                return items;
        }
    }, [children, variant]);

    return (
        <View style={[styles.group, style]} {...rest}>
            {content}
        </View>
    );
};
