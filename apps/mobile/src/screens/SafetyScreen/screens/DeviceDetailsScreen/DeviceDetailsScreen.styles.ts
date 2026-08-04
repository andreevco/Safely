import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    headerPlaceholder: {
        width: 40,
        padding: theme.spacing[12]
    },
    content: {
        paddingHorizontal: theme.spacing[8],
        paddingBottom: theme.spacing[8]
    }
}));
