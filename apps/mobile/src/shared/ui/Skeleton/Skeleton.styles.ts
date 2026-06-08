import { StyleSheet } from 'react-native-unistyles';

type SkeletonOptions = {
    width: number | 'auto';
    height: number | 'auto';
    borderRadius?: number;
};

export const styles = StyleSheet.create(theme => ({
    skeleton: ({ width, height, borderRadius }: SkeletonOptions) => ({
        width,
        height,
        borderRadius: borderRadius ?? theme.radius.sm
    })
}));
