import { Text, TextProps } from '@mobile/shared/ui/Text';

export const CellTitle = (props: TextProps) => {
    const { children, ...rest } = props;

    return (
        <Text numberOfLines={1} variant="labelL" color="primary" {...rest}>
            {children}
        </Text>
    );
};

export const CellSubtitle = (props: TextProps) => {
    const { children, ...rest } = props;

    return (
        <Text numberOfLines={1} variant="bodyM" color="secondary" {...rest}>
            {children}
        </Text>
    );
};

export const CellValue = (props: TextProps) => {
    const { children, ...rest } = props;

    return (
        <Text numberOfLines={1} variant="labelL" color="primary" {...rest}>
            {children}
        </Text>
    );
};

export const CellSubvalue = (props: TextProps) => {
    const { children, ...rest } = props;

    return (
        <Text numberOfLines={1} variant="bodyM" color="tertiary" {...rest}>
            {children}
        </Text>
    );
};
