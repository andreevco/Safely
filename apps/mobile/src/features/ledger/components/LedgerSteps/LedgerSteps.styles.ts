import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    container: {
        width: '100%',
        paddingVertical: theme.spacing[8],
        paddingHorizontal: theme.spacing[16],
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.radius.md
    },
    row: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: theme.spacing[4],
        gap: theme.spacing[8]
    },
    indicator: {
        width: 20,
        height: 20,
        alignItems: 'center',
        justifyContent: 'center'
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: theme.radius.full,
        backgroundColor: theme.colors.icon.tertiary
    }
}));
