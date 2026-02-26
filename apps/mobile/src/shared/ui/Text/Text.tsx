import { Text as RNText, TextProps as RNTextProps, View } from 'react-native';
import { UnistylesVariants, useUnistyles } from 'react-native-unistyles';

import { Skeleton } from '../Skeleton';
import { styles } from './Text.styles';
import { SKELETON_CONFIG } from './Text.styles';

export type TextProps = RNTextProps &
    UnistylesVariants<typeof styles> & {
        skeleton?: boolean;
        skeletonColor?: string;
        skeletonWidth?: number;
    };

export const Text = (props: TextProps) => {
    const {
        children,
        variant,
        textAlign,
        color,
        monospace,
        textTransform,
        skeleton,
        skeletonColor,
        skeletonWidth,
        ...rest
    } = props;
    const { theme } = useUnistyles();

    styles.useVariants({ variant, textAlign, color, monospace, textTransform });

    if (skeleton && !children) {
        // TODO: should add config for other variants
        const { height, width } =
            SKELETON_CONFIG[variant as keyof typeof SKELETON_CONFIG] ?? SKELETON_CONFIG.displayL;
        return (
            <View style={styles.skeletonContainer}>
                <Skeleton
                    width={skeletonWidth ?? width}
                    height={height}
                    borderRadius={theme.radius.sm}
                    color={skeletonColor}
                />
            </View>
        );
    }

    return (
        <RNText allowFontScaling={false} {...rest} style={[styles.text, rest.style]}>
            {children}
        </RNText>
    );
};
