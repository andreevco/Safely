import { Text, TextProps } from '@mobile/shared/ui/Text';

export const Title = (props: TextProps) => {
    const { children, ...rest } = props;

    return (
        <Text numberOfLines={1} variant="labelL" color="primary" {...rest}>
            {children}
        </Text>
    );
};

export const Subtitle = (props: TextProps) => {
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
        <Text numberOfLines={1} variant="labelL" color="primary" {...rest}>
            {children}
        </Text>
    );
};

export const Subvalue = (props: TextProps) => {
    const { children, ...rest } = props;

    return (
        <Text numberOfLines={1} variant="bodyM" color="tertiary" {...rest}>
            {children}
        </Text>
    );
};
