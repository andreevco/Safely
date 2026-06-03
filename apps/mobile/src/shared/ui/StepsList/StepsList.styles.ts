import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    container: {
        width: '100%',
        paddingVertical: theme.spacing[8],
        paddingHorizontal: theme.spacing[16],
        marginVertical: theme.spacing[16],
        backgroundColor: theme.colors.background.secondary,
        borderRadius: theme.radius.md
    },
    row: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        paddingVertical: theme.spacing[4],
        gap: theme.spacing[8]
    },
    number: {
        width: 20,
        height: 20,
        alignItems: 'flex-end'
    },
    text: {
        flex: 1,
        gap: theme.spacing[2]
    }
}));
