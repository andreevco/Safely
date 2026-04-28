import { Text, type TextProps } from '@mobile/shared/ui';

import { styles } from './Description.styles';

export const InputDescription = (props: TextProps) => {
    const { children, style, ...rest } = props;

    return (
        <Text variant="bodyM" color="tertiary" style={[styles.description, style]} {...rest}>
            {children}
        </Text>
    );
};
