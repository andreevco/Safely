import { StyleSheet } from 'react-native-unistyles';

export const styles = StyleSheet.create(theme => ({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: theme.spacing[16],
        paddingHorizontal: theme.spacing[32]
    },
    textContainer: {
        gap: theme.spacing[4]
    }
}));
