import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    textContainer: {
        marginVertical: theme.spacing[16],
        paddingHorizontal: theme.spacing[32],
        gap: theme.spacing[4],
        alignItems: 'center'
    },
    list: {
        marginHorizontal: theme.spacing[16],
        paddingHorizontal: theme.spacing[16],
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.radius.md
    },
    row: {
        paddingVertical: theme.spacing[16]
    }
}));
