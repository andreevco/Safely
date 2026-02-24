import { StyleSheet } from 'react-native-unistyles';

type SkeletonOptions = {
    width: number;
    height: number;
    borderRadius?: number;
    backgroundColor?: string;
};

export const styles = StyleSheet.create(theme => ({
    skeleton: ({ width, height, borderRadius, backgroundColor }: SkeletonOptions) => ({
        width,
        height,
        borderRadius: borderRadius ?? theme.radius.sm,
        backgroundColor: backgroundColor ?? theme.colors.background.secondary,
        overflow: 'hidden'
    })
}));
