import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    content: {
        flexGrow: 1,
        paddingHorizontal: theme.spacing[24],
        paddingBottom: theme.spacing[24],
        gap: theme.spacing[12]
    },
    valueBox: {
        padding: theme.spacing[12],
        borderRadius: theme.spacing[8],
        backgroundColor: theme.colors.background.secondary
    },
    buttons: {
        marginTop: 'auto',
        gap: theme.spacing[4]
    }
}));
