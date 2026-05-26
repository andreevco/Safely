import { Text as RNText, TextProps as RNTextProps, View, ViewStyle } from 'react-native';
import { UnistylesVariants, useUnistyles } from 'react-native-unistyles';

import { Skeleton } from '../Skeleton';
import { styles } from './Text.styles';
import { SKELETON_CONFIG } from './Text.styles';

export type TextProps = RNTextProps &
    UnistylesVariants<typeof styles> & {
        skeleton?: boolean;
        skeletonVariant?: 'transparentElement' | 'secondary';
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
        skeletonVariant,
        skeletonWidth,
        style,
        ...rest
    } = props;
    const { theme } = useUnistyles();
    const hasSkeleton = skeleton || skeletonWidth !== undefined || skeletonVariant !== undefined;

    styles.useVariants({ variant, textAlign, color, monospace, textTransform });

    if (hasSkeleton && children === undefined) {
        // TODO: should add config for other variants
        const { height, width } =
            SKELETON_CONFIG[variant as keyof typeof SKELETON_CONFIG] ?? SKELETON_CONFIG.displayL;
        return (
            <View style={styles.skeletonContainer}>
                <Skeleton
                    width={skeletonWidth ?? width}
                    style={style as ViewStyle}
                    height={height}
                    borderRadius={theme.radius.sm}
                    variant={skeletonVariant ?? 'secondary'}
                />
            </View>
        );
    }

    return (
        <RNText allowFontScaling={false} {...rest} style={[styles.text, style]}>
            {children}
        </RNText>
    );
};
