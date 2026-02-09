import { Text, TextProps } from '@mobile/shared/ui/Text';

export const Label = (props: TextProps) => {
    const { children, ...rest } = props;

    return (
        <Text numberOfLines={1} variant="bodyM" color="secondary" {...rest}>
            {children}
        </Text>
    );
};

export const Value = (props: TextProps) => {
    const { children, ...rest } = props;

    return (
        <Text numberOfLines={1} variant="bodyM" color="primary" {...rest}>
            {children}
        </Text>
    );
};
