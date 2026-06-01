import type { TextProps } from '@mobile/shared/ui/Text';
import { Text } from '@mobile/shared/ui/Text';

import { useCellContext } from '../../CellContext';

export const Title = (props: TextProps) => {
    const { children, ...rest } = props;
    const cellContext = useCellContext();

    return (
        <Text
            numberOfLines={1}
            variant="labelL"
            color="primary"
            skeletonVariant="transparentElement"
            skeleton={cellContext.skeleton}
            {...rest}
        >
            {children}
        </Text>
    );
};

export const Subtitle = (props: TextProps) => {
    const { children, ...rest } = props;
    const cellContext = useCellContext();

    return (
        <Text
            numberOfLines={1}
            variant="bodyM"
            color="tertiary"
            skeletonVariant="transparentElement"
            skeleton={cellContext.skeleton}
            {...rest}
        >
            {children}
        </Text>
    );
};

export const Value = (props: TextProps) => {
    const { children, ...rest } = props;
    const cellContext = useCellContext();

    return (
        <Text
            numberOfLines={1}
            variant="labelL"
            color="primary"
            skeletonVariant="transparentElement"
            skeleton={cellContext.skeleton}
            {...rest}
        >
            {children}
        </Text>
    );
};

export const Subvalue = (props: TextProps) => {
    const { children, ...rest } = props;
    const cellContext = useCellContext();

    return (
        <Text
            numberOfLines={1}
            variant="bodyM"
            color="tertiary"
            skeletonVariant="transparentElement"
            skeleton={cellContext.skeleton}
            {...rest}
        >
            {children}
        </Text>
    );
};
