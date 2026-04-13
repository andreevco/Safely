import { Children, cloneElement, isValidElement, useMemo } from 'react';
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
            case 'divided': {
                const last = items[items.length - 1];
                if (isValidElement(last)) {
                    items[items.length - 1] = cloneElement(last, {
                        showDivider: false
                    } as Record<string, unknown>);
                }
                return items;
            }
            case 'separated':
                return items.map((child, index) => {
                    if (isValidElement(child)) {
                        return (
                            <View style={styles.separatedContainer} key={`item-${index}`}>
                                {cloneElement(child, { showDivider: false } as Record<
                                    string,
                                    unknown
                                >)}
                            </View>
                        );
                    }
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
