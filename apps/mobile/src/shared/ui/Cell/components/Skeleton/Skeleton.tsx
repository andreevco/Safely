import { useUnistyles } from 'react-native-unistyles';

import { Skeleton } from '@mobile/shared/ui/Skeleton';

export const Image = () => {
    const { theme } = useUnistyles();

    return (
        <Skeleton
            width={32}
            height={32}
            borderRadius={theme.radius.full}
            color={theme.colors.other.transparentElement}
        />
    );
};

export const Title = () => {
    const { theme } = useUnistyles();

    return (
        <Skeleton
            width={56}
            height={16}
            borderRadius={theme.radius.full}
            color={theme.colors.other.transparentElement}
        />
    );
};

export const Subtitle = () => {
    const { theme } = useUnistyles();

    return (
        <Skeleton
            width={64}
            height={14}
            borderRadius={theme.radius.full}
            color={theme.colors.other.transparentElement}
        />
    );
};

export const Value = () => {
    const { theme } = useUnistyles();

    return (
        <Skeleton
            width={48}
            height={16}
            borderRadius={theme.radius.full}
            color={theme.colors.other.transparentElement}
        />
    );
};

export const Subvalue = () => {
    const { theme } = useUnistyles();

    return (
        <Skeleton
            width={40}
            height={14}
            borderRadius={theme.radius.full}
            color={theme.colors.other.transparentElement}
        />
    );
};
