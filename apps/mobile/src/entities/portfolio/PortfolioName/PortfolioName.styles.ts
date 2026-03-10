import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    container: (gap: number) => ({
        flexDirection: 'row',
        alignItems: 'center',
        gap
    }),
    dot: (color: string, size: number) => ({
        width: size,
        height: size,
        borderRadius: theme.radius.full,
        backgroundColor: color
    }),
    tag: {
        paddingVertical: 1,
        paddingHorizontal: theme.spacing[4],
        borderRadius: theme.radius.xss,
        backgroundColor: theme.colors.background.tertiary
    },
    contentWithTag: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: theme.spacing[4]
    }
}));
