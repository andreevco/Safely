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
    })
}));
