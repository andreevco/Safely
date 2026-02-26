import { useUnistyles } from 'react-native-unistyles';

import { Text, TextProps } from '@mobile/shared/ui/Text';

import { useCellContext } from '../../CellContext';

export const Title = (props: TextProps) => {
    const { children, ...rest } = props;
    const cellContext = useCellContext();
    const { theme } = useUnistyles();

    return (
        <Text
            numberOfLines={1}
            variant="labelL"
            color="primary"
            skeletonColor={theme.colors.other.transparentElement}
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
    const { theme } = useUnistyles();

    return (
        <Text
            numberOfLines={1}
            variant="bodyM"
            color="secondary"
            skeletonColor={theme.colors.other.transparentElement}
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
    const { theme } = useUnistyles();

    return (
        <Text
            numberOfLines={1}
            variant="labelL"
            color="primary"
            skeletonColor={theme.colors.other.transparentElement}
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
    const { theme } = useUnistyles();

    return (
        <Text
            numberOfLines={1}
            variant="bodyM"
            color="tertiary"
            skeletonColor={theme.colors.other.transparentElement}
            skeleton={cellContext.skeleton}
            {...rest}
        >
            {children}
        </Text>
    );
};
