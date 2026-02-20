import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    container: {
        paddingHorizontal: theme.spacing[8],
        gap: theme.spacing[16]
    },
    headerPlaceholder: {
        width: 40,
        padding: theme.spacing[12]
    }
}));
