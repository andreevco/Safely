import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    container: {
        paddingHorizontal: theme.spacing[8],
        gap: theme.spacing[16]
    },
    headerPlaceholder: {
        width: 40,
        padding: theme.spacing[12]
    },
    version: {
        marginHorizontal: theme.spacing[16],
        marginTop: theme.spacing[24],
        marginBottom: theme.spacing[32]
    }
}));
