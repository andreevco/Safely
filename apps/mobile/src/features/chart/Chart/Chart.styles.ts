import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    container: {
        backgroundColor: theme.colors.background.secondary,
        marginHorizontal: theme.spacing[8],
        borderRadius: theme.radius.md
    }
}));
